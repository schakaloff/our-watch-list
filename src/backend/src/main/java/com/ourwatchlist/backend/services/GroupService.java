// The rules for groups: create one, join with a code, list mine, and check membership.
// A couple's group holds at most two people.
package com.ourwatchlist.backend.services;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ourwatchlist.backend.dto.GroupDtos.GroupResponse;
import com.ourwatchlist.backend.dto.GroupDtos.MemberResponse;
import com.ourwatchlist.backend.entity.GroupMember;
import com.ourwatchlist.backend.entity.GroupMovie;
import com.ourwatchlist.backend.entity.WatchGroup;
import com.ourwatchlist.backend.exception.ApiException;
import com.ourwatchlist.backend.repository.GroupMemberRepository;
import com.ourwatchlist.backend.repository.GroupMovieRepository;
import com.ourwatchlist.backend.repository.GroupRepository;
import com.ourwatchlist.backend.security.RateLimiter;

@Service
public class GroupService {

    // Letters and digits without look-alikes (no 0/O, 1/I), so the code is easy to read and type.
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final int MAX_MEMBERS = 2;

    private final GroupRepository groups;
    private final GroupMemberRepository members;
    private final GroupMovieRepository movies;
    private final ProfileService profiles;
    private final RateLimiter rateLimiter;
    private final SecureRandom random = new SecureRandom();

    // Spring passes in the repositories and the profile service here.
    public GroupService(GroupRepository groups, GroupMemberRepository members,
            GroupMovieRepository movies, ProfileService profiles, RateLimiter rateLimiter) {
        this.groups = groups;
        this.members = members;
        this.movies = movies;
        this.profiles = profiles;
        this.rateLimiter = rateLimiter;
    }

    // Creates a group with a fresh invite code and adds the creator as its first member.
    @Transactional
    public GroupResponse createGroup(UUID userId, String email, String name) {
        String cleanName = clean(name, "Group name", 50);
        profiles.getOrCreate(userId, email);

        WatchGroup group = groups.save(new WatchGroup(cleanName, newInviteCode(), userId));
        members.save(new GroupMember(group.getId(), userId));
        return toResponse(group, userId);
    }

    // Adds the user to the group that owns this invite code, if there is room.
    @Transactional
    public GroupResponse joinGroup(UUID userId, String email, String code) {
        // An invite code works like a password, so guessing it is limited to 10 tries a minute per person.
        if (!rateLimiter.allow("join:" + userId, 10, 60_000)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Wait a minute and try again.");
        }
        String cleanCode = code == null ? "" : code.trim().toUpperCase();

        WatchGroup group = groups.findByInviteCode(cleanCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No group has that code"));

        if (members.existsByIdGroupIdAndIdUserId(group.getId(), userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "You are already in this group");
        }
        if (members.countByIdGroupId(group.getId()) >= MAX_MEMBERS) {
            throw new ApiException(HttpStatus.CONFLICT, "This group is full");
        }

        profiles.getOrCreate(userId, email);
        members.save(new GroupMember(group.getId(), userId));
        return toResponse(group, userId);
    }

    // All groups the user belongs to. Always 4 queries, however many groups there are.
    public List<GroupResponse> myGroups(UUID userId) {
        List<UUID> groupIds = members.findByIdUserId(userId).stream()
                .map(GroupMember::getGroupId)
                .toList();
        return toResponses(groups.findAllById(groupIds), userId);
    }

    // Deletes a group together with its movies, ratings and members (the database removes those
    // automatically). Only the person who created the group may do this.
    public void deleteGroup(UUID userId, UUID groupId) {
        requireMember(userId, groupId);

        WatchGroup group = groups.findById(groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Group not found"));
        if (!group.getCreatedBy().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the person who created the group can delete it");
        }
        groups.delete(group);
    }

    // For each of the user's groups, the TMDB ids of the movies already on its list.
    // The home page uses this to show which movies are already added, in one request.
    public Map<UUID, List<Integer>> savedTmdbIds(UUID userId) {
        List<UUID> groupIds = members.findByIdUserId(userId).stream()
                .map(GroupMember::getGroupId)
                .toList();

        Map<UUID, List<Integer>> saved = new HashMap<>();
        for (UUID groupId : groupIds) {
            saved.put(groupId, new ArrayList<>());
        }
        for (GroupMovie movie : movies.findByGroupIdIn(groupIds)) {
            saved.get(movie.getGroupId()).add(movie.getTmdbId());
        }
        return saved;
    }

    // Stops the request unless the user is in this group.
    // Says "not found" (not "forbidden") so outsiders cannot tell which groups exist.
    public void requireMember(UUID userId, UUID groupId) {
        if (!members.existsByIdGroupIdAndIdUserId(groupId, userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Group not found");
        }
    }

    // Checks the user is in the group and returns every member's display name, in just two queries.
    // Used to label ratings. Like requireMember, it says "not found" to outsiders.
    public Map<UUID, String> memberNames(UUID userId, UUID groupId) {
        List<UUID> userIds = members.findByIdGroupId(groupId).stream().map(GroupMember::getUserId).toList();
        if (!userIds.contains(userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Group not found");
        }
        return profiles.displayNames(userIds);
    }

    // Same as memberNames, without the membership check. Used for ratings the user just saved.
    public Map<UUID, String> displayNames(UUID groupId) {
        List<UUID> userIds = members.findByIdGroupId(groupId).stream().map(GroupMember::getUserId).toList();
        return profiles.displayNames(userIds);
    }

    // Builds a code that no other group uses yet.
    private String newInviteCode() {
        while (true) {
            StringBuilder code = new StringBuilder();
            for (int i = 0; i < CODE_LENGTH; i++) {
                code.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
            }
            if (!groups.existsByInviteCode(code.toString())) {
                return code.toString();
            }
        }
    }

    // Turns one group into the shape the frontend receives, including its members.
    private GroupResponse toResponse(WatchGroup group, UUID viewerId) {
        return toResponses(List.of(group), viewerId).get(0);
    }

    // Turns many groups into responses using just 2 queries: all their members at once,
    // then all those people's names at once.
    private List<GroupResponse> toResponses(List<WatchGroup> groupList, UUID viewerId) {
        List<UUID> groupIds = groupList.stream().map(WatchGroup::getId).toList();
        List<GroupMember> memberRows = members.findByIdGroupIdIn(groupIds);
        Map<UUID, String> names = profiles.displayNames(memberRows.stream().map(GroupMember::getUserId).distinct().toList());

        return groupList.stream()
                .map(group -> {
                    List<MemberResponse> memberList = memberRows.stream()
                            .filter(m -> m.getGroupId().equals(group.getId()))
                            .map(m -> new MemberResponse(m.getUserId(), names.get(m.getUserId())))
                            .toList();
                    boolean owner = group.getCreatedBy().equals(viewerId);
                    return new GroupResponse(group.getId(), group.getName(), group.getInviteCode(), owner, memberList);
                })
                .toList();
    }

    // Trims the text and rejects it if it is empty or too long.
    private String clean(String value, String label, int maxLength) {
        if (value == null || value.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new ApiException(HttpStatus.BAD_REQUEST, label + " is too long");
        }
        return trimmed;
    }
}
