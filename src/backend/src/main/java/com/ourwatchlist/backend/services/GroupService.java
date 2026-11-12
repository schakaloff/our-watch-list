// The rules for groups: create one, join with a code, list mine, and check membership.
// A couple's group holds at most two people.
package com.ourwatchlist.backend.services;

import java.security.SecureRandom;
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
import com.ourwatchlist.backend.entity.WatchGroup;
import com.ourwatchlist.backend.exception.ApiException;
import com.ourwatchlist.backend.repository.GroupMemberRepository;
import com.ourwatchlist.backend.repository.GroupRepository;

@Service
public class GroupService {

    // Letters and digits without look-alikes (no 0/O, 1/I), so the code is easy to read and type.
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final int MAX_MEMBERS = 2;

    private final GroupRepository groups;
    private final GroupMemberRepository members;
    private final SecureRandom random = new SecureRandom();

    // Spring passes in the repositories here.
    public GroupService(GroupRepository groups, GroupMemberRepository members) {
        this.groups = groups;
        this.members = members;
    }

    // Creates a group with a fresh invite code and adds the creator as its first member.
    @Transactional
    public GroupResponse createGroup(UUID userId, String name, String displayName) {
        String cleanName = clean(name, "Group name", 50);
        String cleanDisplay = clean(displayName, "Your name", 30);

        WatchGroup group = groups.save(new WatchGroup(cleanName, newInviteCode(), userId));
        members.save(new GroupMember(group.getId(), userId, cleanDisplay));
        return toResponse(group);
    }

    // Adds the user to the group that owns this invite code, if there is room.
    @Transactional
    public GroupResponse joinGroup(UUID userId, String code, String displayName) {
        String cleanDisplay = clean(displayName, "Your name", 30);
        String cleanCode = code == null ? "" : code.trim().toUpperCase();

        WatchGroup group = groups.findByInviteCode(cleanCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No group has that code"));

        if (members.existsByIdGroupIdAndIdUserId(group.getId(), userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "You are already in this group");
        }
        if (members.countByIdGroupId(group.getId()) >= MAX_MEMBERS) {
            throw new ApiException(HttpStatus.CONFLICT, "This group is full");
        }

        members.save(new GroupMember(group.getId(), userId, cleanDisplay));
        return toResponse(group);
    }

    // All groups the user belongs to.
    public List<GroupResponse> myGroups(UUID userId) {
        List<UUID> groupIds = members.findByIdUserId(userId).stream()
                .map(GroupMember::getGroupId)
                .toList();
        return groups.findAllById(groupIds).stream().map(this::toResponse).toList();
    }

    // Stops the request unless the user is in this group.
    // Says "not found" (not "forbidden") so outsiders cannot tell which groups exist.
    public void requireMember(UUID userId, UUID groupId) {
        if (!members.existsByIdGroupIdAndIdUserId(groupId, userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Group not found");
        }
    }

    // Maps each member's user id to their display name. Used to label ratings.
    public Map<UUID, String> displayNames(UUID groupId) {
        Map<UUID, String> names = new HashMap<>();
        for (GroupMember member : members.findByIdGroupId(groupId)) {
            names.put(member.getUserId(), member.getDisplayName());
        }
        return names;
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

    // Turns a group into the shape the frontend receives, including its members.
    private GroupResponse toResponse(WatchGroup group) {
        List<MemberResponse> memberList = members.findByIdGroupId(group.getId()).stream()
                .map(m -> new MemberResponse(m.getUserId(), m.getDisplayName()))
                .toList();
        return new GroupResponse(group.getId(), group.getName(), group.getInviteCode(), memberList);
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
