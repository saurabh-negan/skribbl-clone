import { useEffect, useState } from "react";
import useUserStore from "../store/userStore";
import socket from "../socket";

const ChatBox = () => {
  const [message, setMessage] = useState("");
  const { messages, setMessages, name, roomCode } = useUserStore();

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      sender: name,
      text: message.trim(),
    };

    // Emit to server
    socket.emit("chat_message", { roomCode, ...newMessage });
    setMessage("");
  };

  // Receive messages
  useEffect(() => {
    socket.on("chat_message", (incomingMessage) => {
      setMessages((prev) => [...prev, incomingMessage]);
    });

    return () => {
      socket.off("chat_message");
    };
  }, [setMessages]);

  return (
    <div className="flex flex-col h-full w-80 bg-zinc-800 p-4">
      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {messages.map((msg, idx) => (
          <div key={idx} className="bg-zinc-700 p-2 rounded">
            <strong className="text-green-400">{msg.sender}</strong>:{" "}
            <span>{msg.text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex">
        <input
          type="text"
          className="flex-1 p-2 rounded-l bg-zinc-600 text-white outline-none"
          placeholder="Type your guess..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="submit"
          className="bg-green-600 px-4 rounded-r text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
