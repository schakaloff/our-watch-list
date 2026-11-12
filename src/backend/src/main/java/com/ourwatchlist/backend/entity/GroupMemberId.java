// The two-part primary key of group_members: which group and which user.
// A record already gives us the equals/hashCode that JPA needs for keys.
package com.ourwatchlist.backend.entity;

import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public record GroupMemberId(
        @Column(name = "group_id") UUID groupId,
        @Column(name = "user_id") UUID userId) implements Serializable {}
