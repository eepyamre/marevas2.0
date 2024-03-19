import { Core } from "../core";

export const chatInit = () => {
  const chat = document.querySelector(".chat");
  const messageList = document.querySelector(".chat .message_list");
  const sendBtn = document.querySelector(".chat .input_wrapper img");
  const hideBtn = document.querySelector(".chat .header");
  const input: HTMLInputElement = document.querySelector(".chat input");
  const ws = new WebSocket("wss://drawamare.xyz/socket_chat/");

  const sendMessage = (text: string) => {
    ws.send(
      JSON.stringify({
        user: Core.networkController.username,
        text,
      })
    );
  };

  const onMessage = (event: any) => {
    const { user, text } = JSON.parse(event.data);
    const el = document.createElement("div");
    el.classList.add("message_wrapper");
    el.innerHTML = `
      <div class="avatar"></div>
      <div class="message">
        <p class="user">${user}</p>
        <p class="text">${text}</p>
      </div>
    `;
    messageList.append(el);
    el.scrollIntoView();
  };

  const start = () => {
    hideBtn.addEventListener("click", () => {
      if (!chat.classList.contains("hide")) {
        chat.classList.add("hide");
      } else {
        chat.classList.remove("hide");
      }
    });
    sendBtn.addEventListener("click", () => {
      if (input.value) {
        sendMessage(input.value);
        input.value = "";
      }
    });
    input.addEventListener("keydown", (e) => {
      if (input.value) {
        if (e.key === "Enter") {
          sendMessage(input.value);
          input.value = "";
        }
      }
    });
  };

  ws.onopen = start;
  ws.onmessage = onMessage;
};
