(() => {
    const API_URL = "https://gmbfbot.up.railway.app/webchat/message";
    const SESSION_KEY = "gmbf_webchat_session";

    const root = document.createElement("div");
    root.className = "gmbf-chat";
    root.innerHTML = `
        <button class="gmbf-chat-toggle" aria-label="Open chat">AI Chat</button>
        <section class="gmbf-chat-panel" aria-hidden="true">
            <header class="gmbf-chat-header">
                <strong>GMBF AI Assistant</strong>
                <button class="gmbf-chat-close" aria-label="Close chat">&times;</button>
            </header>
            <div class="gmbf-chat-messages"></div>
            <form class="gmbf-chat-form">
                <input type="text" class="gmbf-chat-input" placeholder="Ask about products or services..." required />
                <button type="submit">Send</button>
            </form>
        </section>
    `;
    document.body.appendChild(root);

    const toggleBtn = root.querySelector(".gmbf-chat-toggle");
    const panel = root.querySelector(".gmbf-chat-panel");
    const closeBtn = root.querySelector(".gmbf-chat-close");
    const form = root.querySelector(".gmbf-chat-form");
    const input = root.querySelector(".gmbf-chat-input");
    const messages = root.querySelector(".gmbf-chat-messages");

    let open = false;
    let sessionId = localStorage.getItem(SESSION_KEY) || "";

    function setOpen(nextOpen) {
        open = nextOpen;
        panel.classList.toggle("open", open);
        panel.setAttribute("aria-hidden", String(!open));
        if (open) {
            input.focus();
        }
    }

    function appendMessage(text, sender) {
        const msg = document.createElement("div");
        msg.className = `gmbf-chat-msg ${sender}`;
        msg.textContent = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function setSending(sending) {
        input.disabled = sending;
        form.querySelector("button").disabled = sending;
    }

    async function sendMessage(text) {
        setSending(true);
        appendMessage(text, "user");
        appendMessage("Typing...", "bot pending");

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    session_id: sessionId || undefined,
                }),
            });
            const data = await response.json();

            const pending = messages.querySelector(".gmbf-chat-msg.pending");
            if (pending) pending.remove();

            if (data && data.session_id) {
                sessionId = data.session_id;
                localStorage.setItem(SESSION_KEY, sessionId);
            }

            if (!response.ok || !data || !data.reply) {
                appendMessage("Sorry, I cannot respond right now. Please email contact@gmbfgroup.com.", "bot");
                return;
            }

            appendMessage(data.reply, "bot");
        } catch (error) {
            const pending = messages.querySelector(".gmbf-chat-msg.pending");
            if (pending) pending.remove();
            appendMessage("Network error. Please try again later.", "bot");
        } finally {
            setSending(false);
        }
    }

    toggleBtn.addEventListener("click", () => setOpen(!open));
    closeBtn.addEventListener("click", () => setOpen(false));

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = "";
        sendMessage(text);
    });

    appendMessage("Hello! I am GMBF AI Assistant. How can I help you today?", "bot");
})();
