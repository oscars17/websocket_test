<template lang="pug">

div.card(v-if="!wsConnected")
  div.card__body
    LoadingSpinner(v-if="accessGainingStatus")
  div.card__actions
    button.submit-button(@click="initWsConnection") Подключиться
div.card(v-else)
  div.card__body
    input.card-input(v-model="inputMessage")
  div.card__actions
    button.submit-button(:class="inputMessage.length === 0 ? 'button-disabled' : ''" @click="putInboxMessage") Отправить
</template>

<script lang="ts">
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import ToastifyHandler from "@/toastify/toastifyHandler";
import { defineComponent, ref, watch } from "vue";
import axiosObj from "@/axios/axiosObj";

// Не везде успел прописать типы :<

//

type accessTokenResponseType = {
  [key: string]: any;
  ok: boolean;
  accessToken: string;
  refreshToken: string;
};

type putInboxMessageResponseType = {
  [key: string]: any;
  ok: boolean;
};

export default defineComponent({
  name: "MainView",
  components: { LoadingSpinner },
  setup() {
    // dicts
    const apiMap: Record<string, string> = {
      accessToken: "auth-back/api/v2/login",
      getInboxMessage: "noty/api/v1/getInboxMessages",
      putInboxMessage: "noty/api/private/putInboxMessage",
      ws: "wss://webberu.dev-webdevep.ru/noty/notifications",
    };
    const accessTokenRequestCredentials: Record<string, string> = {
      credential: "79997654321",
      password: "test",
    };

    // refs
    const putInboxPayload = ref<Record<string, string>>({});

    const wsConnected = ref<boolean>(false);

    // access token from button's, post request
    const accessToken = ref<string>("");
    const accessGainingStatus = ref<boolean>(false);

    // unique id from websocket message
    const uniqueId = ref<string>("");

    // form input
    const inputMessage = ref<string>("");

    // ws
    let wsConnection: undefined | WebSocket = undefined;

    // watchers
    watch(wsConnected, (newVal, oldVal) => {
      if (newVal) {
        const wsAccessPayload: Record<string, string> = {
          id: uniqueId.value,
          access_token: accessToken.value,
        };
        if (wsConnection) wsConnection.send(JSON.stringify(wsAccessPayload));
        accessGainingStatus.value = false;
      }
    });

    // get access_token method
    const getAccessToken = async (): Promise<void> => {
      accessGainingStatus.value = true;
      await axiosObj
        .post<accessTokenResponseType>(
          apiMap.accessToken,
          accessTokenRequestCredentials
        )
        .then((r) => (accessToken.value = r.data.accessToken));
    };

    // ws methods
    const proceedWsConnection = (): void => {
      wsConnection = new WebSocket(
        "wss://webberu.dev-webdevep.ru/noty/notifications"
      );
      setWsOnMessageHandlers();
    };
    const setWsOnMessageHandlers = (): void => {
      if (!wsConnection) return
      wsConnection.onmessage = (r) => {
        const responseData = JSON.parse(r.data);
        if (responseData.id) {
          uniqueId.value = responseData.id;
          wsConnected.value = true;
        } else if (responseData.type === "inbox") {
          const toastifyHandlerInstance = new ToastifyHandler(
            putInboxPayload.value.message,
            putInboxPayload.value.subject
          );
          toastifyHandlerInstance.showToast();
        }
      };
    };

    // api message methods
    const putInboxMessage = async (): Promise<void> => {
      const subjectRandomizer = ["error", "info", "success"];
      putInboxPayload.value = {
        message: inputMessage.value,
        recipient: "q325Q8JPCprQ",
        subject:
          subjectRandomizer[
            Math.floor(Math.random() * subjectRandomizer.length)
          ],
      };
      await axiosObj
        .post<putInboxMessageResponseType>(
          apiMap.putInboxMessage,
          putInboxPayload.value
        )
        .then(async (r) => {
          console.log(r);
          inputMessage.value = "";
        });
    };

    // initialize ws connection from button click
    const initWsConnection = async (): Promise<void> =>
      await getAccessToken()
        .then(async () => proceedWsConnection())
        .catch(() => console.log("nothing really matters anymore"));

    return {
      wsConnected,
      putInboxMessage,
      inputMessage,
      initWsConnection,
      accessGainingStatus,
    };
  },
});
</script>
