
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const fetchMessages = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/chat/messages", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = Array.isArray(res.data) ? res.data : res.data.messages || [];
      setMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const res = await axios.post(
        "http://localhost:5000/api/chat/message",
        { content },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessages((prevMessages) => [
        ...prevMessages,
        res.data.userMessage,
        res.data.aiMessage,
      ]);
      setContent("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
    
      <div className="flex justify-between items-center p-4 bg-white shadow-md sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-700">
          AI Journal Assistant
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-sm"
        >
          Logout
        </button>
      </div>

  
      <div className="flex-1 overflow-y-auto  space-y-3 bg-black mb-10 ">
        <div className="p-4">

     
        {Array.isArray(messages) &&
          messages.map((msg) => (
           
            <div
              key={msg._id}
              className={`px-4 py-2 rounded-2xl  max-w-[80%] md:max-w-[60%] break-words shadow mb-4
    ${
      msg.sender === "user"
        ? "bg-blue-600 text-white self-end ml-auto rounded-br-none md:w-[30%]"
        : "bg-gray-100 text-gray-800 self-start mr-auto rounded-bl-none"
    }`}
            >
              {msg.content}
            </div>
          ))}
             </div>
<div>
        <form
          onSubmit={sendMessage}
          className="fixed bottom-0 p-4 bg-white border-t flex gap-2 items-center w-full "
        >
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 "
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Send
          </button>
        </form>
        
        </div>
      </div>
    </div>
  );
}

export default Chat;
