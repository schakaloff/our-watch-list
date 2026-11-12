// The group routes: create a group, join one with a code, and list your groups.
// The logged-in user comes from the login cookie (see CookieAuthFilter).
package com.ourwatchlist.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ourwatchlist.backend.dto.GroupDtos.CreateGroupRequest;
import com.ourwatchlist.backend.dto.GroupDtos.GroupResponse;
import com.ourwatchlist.backend.dto.GroupDtos.JoinGroupRequest;
import com.ourwatchlist.backend.dto.SupabaseUser;
import com.ourwatchlist.backend.services.GroupService;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    // Spring passes in the group service here.
    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    // Handles POST /api/groups. Creates a group and returns it with its invite code.
    @PostMapping
    public GroupResponse create(@AuthenticationPrincipal SupabaseUser user, @RequestBody CreateGroupRequest body) {
        return groupService.createGroup(UUID.fromString(user.id()), user.email(), body.name());
    }

    // Handles POST /api/groups/join. Joins the group that owns the invite code.
    @PostMapping("/join")
    public GroupResponse join(@AuthenticationPrincipal SupabaseUser user, @RequestBody JoinGroupRequest body) {
        return groupService.joinGroup(UUID.fromString(user.id()), user.email(), body.code());
    }

    // Handles GET /api/groups. Lists the groups the logged-in user belongs to.
    @GetMapping
    public List<GroupResponse> mine(@AuthenticationPrincipal SupabaseUser user) {
        return groupService.myGroups(UUID.fromString(user.id()));
    }
}
