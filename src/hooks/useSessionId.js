import { useState, useEffect } from "react";

export function useSessionId() {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    let s = sessionStorage.getItem("tm_session_id");
    if (!s) {
      s = typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem("tm_session_id", s);
    }
    setSessionId(s);
  }, []);

  return sessionId;
}
