// The shapes of the data sent to and from the group routes.
// Requests are what the frontend sends; responses are what the backend returns.
package com.ourwatchlist.backend.dto;

import java.util.List;
import java.util.UUID;

public final class GroupDtos {

    private GroupDtos() {}

    // Body of "create a group".
    public record CreateGroupRequest(String name, String displayName) {}

    // Body of "join a group with a code".
    public record JoinGroupRequest(String code, String displayName) {}

    // One person in a group, as shown to the frontend.
    public record MemberResponse(UUID userId, String displayName) {}

    // A group with its invite code and members.
    public record GroupResponse(UUID id, String name, String inviteCode, List<MemberResponse> members) {}
}
