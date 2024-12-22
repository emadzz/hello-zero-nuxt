<script setup lang="ts">
import type { Schema } from "~/zero-schema";
import { escapeLike } from "@rocicorp/zero";

const cookie = useCookie("jwt");

const z = useZero<Schema>();
const users = useQuery(z?.query.user);
const mediums = useQuery(z?.query.medium);

console.log(
  import.meta.server ? "server" : import.meta.client ? "client" : "unknown",
  "z",
  z
);

const filterUser = ref<string>("");
const filterText = ref<string>("");

const all = z?.query.message;
const allMessages = useQuery(all);

const filteredMessages = useQuery(() => {
  let q = z.query.message
    .related("sender", (sender) => sender.one())
    .related("medium", (medium) => medium.one())
    .orderBy("timestamp", "desc");

  if (filterUser.value) {
    q = q.where("senderID", filterUser.value);
  }

  if (filterText.value) {
    q = q.where("body", "LIKE", `%${escapeLike(filterText.value)}%`);
  }

  return q;
});

const hasFilters = computed(() => filterUser.value || filterText.value);
const action = ref<"add" | "remove" | undefined>(undefined);
const interval = useInterval(1000 / 60, {
  immediate: action.value !== undefined,
  callback() {
    if (!handleAction()) {
      action.value = undefined;
    }
  },
  controls: true,
});
const holdTimerRef = ref<NodeJS.Timeout | null>(null);

watch(action, (newAction) =>
  newAction !== undefined ? interval.resume() : interval.pause()
);

const deleteRandomMessage = () => {
  if (!allMessages.value || allMessages.value.length === 0) {
    return false;
  }
  const index = randInt(allMessages.value.length);
  z.mutate.message.delete({ id: allMessages.value[index].id });

  return true;
};

const addRandomMessage = () => {
  z.mutate.message.insert(randomMessage(users.value!, mediums.value!));
  return true;
};

const handleAction = () => {
  if (action.value === "add") {
    return addRandomMessage();
  } else if (action.value === "remove") {
    return deleteRandomMessage();
  }

  return false;
};

const INITIAL_HOLD_DELAY_MS = 300;
const handleAddAction = () => {
  addRandomMessage();
  holdTimerRef.value = setTimeout(() => {
    action.value = "add";
  }, INITIAL_HOLD_DELAY_MS);
};

const handleRemoveAction = (e: MouseEvent | TouchEvent) => {
  if (z.userID === "anon" && "shiftKey" in e && !e.shiftKey) {
    alert("You must be logged in to delete. Hold shift to try anyway.");
    return;
  }
  deleteRandomMessage();

  holdTimerRef.value = setTimeout(() => {
    action.value = "remove";
  }, INITIAL_HOLD_DELAY_MS);
};

const stopAction = () => {
  if (holdTimerRef.value) {
    clearTimeout(holdTimerRef.value);
    holdTimerRef.value = null;
  }

  action.value = undefined;
};

const editMessage = (
  e: MouseEvent,
  id: string,
  senderID: string,
  prev: string
) => {
  if (senderID !== z.userID && !e.shiftKey) {
    alert(
      "You aren't logged in as the sender of this message. Editing won't be permitted. Hold the shift key to try anyway."
    );
    return;
  }
  const body = prompt("Edit message", prev);
  z.mutate.message.update({
    id,
    body: body ?? prev,
  });
};

const toggleLogin = async () => {
  if (z.userID === "anon") {
    await $fetch("/api/login", {
      method: "post",
    });
  } else {
    cookie.value = null;
  }
  location.reload();
};

const user = computed(
  () => users.value?.find((user) => user.id === z.userID)?.name ?? "anon"
);
</script>
<template>
  <div class="controls">
    <div>
      <button
        @mousedown="handleAddAction"
        @mouseup="stopAction"
        @mouseleave="stopAction"
        @touchstart="handleAddAction"
        @touchend="stopAction"
      >
        Add Messages
      </button>
      <button
        @mousedown="handleRemoveAction"
        @mouseup="stopAction"
        @mouseleave="stopAction"
        @touchstart="handleRemoveAction"
        @touchend="stopAction"
      >
        Remove Messages
      </button>
      <em>(hold down buttons to repeat)</em>
    </div>
    <div
      :style="{
        justifyContent: 'end',
      }"
    >
      {{ user === "anon" ? "" : `Logged in as ${user}` }}
      <button @mousedown="() => toggleLogin()">
        {{ user === "anon" ? "Login" : "Logout" }}
      </button>
    </div>
  </div>
  <div class="controls">
    <div>
      From:
      <select v-model="filterUser" :style="{ flex: 1 }">
        <option value="">Sender</option>
        <option v-for="user of users" :key="user.id" :value="user.id">
          {{ user.name }}
        </option>
      </select>
    </div>
    <div>
      Contains:
      <input
        v-model="filterText"
        type="text"
        placeholder="message"
        :style="{ flex: 1 }"
      />
    </div>
  </div>
  <div class="controls">
    <em>
      <template v-if="!hasFilters"
        >Showing all {{ filteredMessages?.length || 0 }} messages</template
      >
      <template v-else>
        Showing {{ filteredMessages?.length }} of
        {{ allMessages?.length }} messages. Try opening
        <a href="/" target="_blank">another tab</a> to see them all!
      </template>
    </em>
  </div>
  <h3 v-if="!filteredMessages || filteredMessages.length === 0">
    <em>No posts found 😢</em>
  </h3>
  <table v-else border="1" cellSpacing="0" cellPadding="6" width="100%">
    <thead>
      <tr>
        <th>Sender</th>
        <th>Medium</th>
        <th>Message</th>
        <th>Sent</th>
        <th>Edit</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="message of filteredMessages" key="{message.id}">
        <td align="left">
          {{ message.sender?.name }}
        </td>
        <td align="left">{{ message.medium?.name }}</td>
        <td align="left">{{ message.body }}</td>
        <td align="right">{{ formatDate(message.timestamp) }}</td>
        <td
          @mousedown="
            (e) => editMessage(e, message.id, message.senderID, message.body)
          "
        >
          ✏️
        </td>
      </tr>
    </tbody>
  </table>
</template>
