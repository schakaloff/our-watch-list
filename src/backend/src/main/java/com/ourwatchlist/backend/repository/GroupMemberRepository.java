// Database access for group members: who belongs to which group.
// The key has two parts, so "Id" in a method name means the key (Id + GroupId = id.groupId).
package com.ourwatchlist.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ourwatchlist.backend.entity.GroupMember;
import com.ourwatchlist.backend.entity.GroupMemberId;

public interface GroupMemberRepository extends JpaRepository<GroupMember, GroupMemberId> {

    // All members of one group (at most two for a couple).
    List<GroupMember> findByIdGroupId(UUID groupId);

    // The members of many groups in one query, so listing groups does not need a query per group.
    List<GroupMember> findByIdGroupIdIn(Collection<UUID> groupIds);

    // All groups a user belongs to.
    List<GroupMember> findByIdUserId(UUID userId);

    // How many members a group has. Used to stop a third person from joining.
    long countByIdGroupId(UUID groupId);

    // Is this user in this group? The check every group route makes before doing anything.
    boolean existsByIdGroupIdAndIdUserId(UUID groupId, UUID userId);
}
