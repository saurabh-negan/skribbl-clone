import { useEffect, useState, useRef } from "react";
import useUserStore from "../store/userStore";
import socket from "../socket";

const ChatBox = () => {
  const [message, setMessage] = useState("");
  const { name, roomCode, messages, addMessage, wordBlanks } = useUserStore();
  const messagesEndRef = useRef(null);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const newMessage = { sender: name, text: message.trim() };
    socket.emit("chat_message", { roomCode, ...newMessage });
    setMessage("");
  };

  useEffect(() => {
    socket.on("chat_message", addMessage);
    return () => socket.off("chat_message");
  }, [addMessage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-zinc-800 p-4">
      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {wordBlanks.length > 0 && (
          <div className="mb-2 text-xl tracking-widest text-center">
            {wordBlanks.join(" ")}
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className="bg-zinc-700 p-2 rounded">
            <strong className="text-green-400">{msg.sender}</strong>:{" "}
            <span>{msg.text}</span>
          </div>
        ))}
        {/* Dummy div to scroll into */}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex">
        <input
          type="text"
          className="flex-1 p-2 bg-zinc-600 text-white rounded-l focus:outline-none"
          placeholder="Type your guess..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="submit"
          className="bg-green-600 px-4 py-2 rounded-r text-white hover:bg-green-700"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
