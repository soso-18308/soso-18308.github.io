const canvas = document.getElementById("entity");
const ctx = canvas.getContext("2d");
const input = document.getElementById("input");
const reply = document.getElementById("reply");

canvas.width = innerWidth;
canvas.height = innerHeight;

let mood = "calm";
let blink = 0;

function drawFace() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const colors = {
    calm: "#6cf",
    angry: "#ff4b4b",
    sad: "#889",
    curious: "#b56cff"
  };

  // tête
  ctx.beginPath();
  ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.fillStyle = colors[mood];
  ctx.globalAlpha = 0.15;
  ctx.fill();
  ctx.globalAlpha = 1;

  // yeux
  const eyeY = cy - 20;
  const eyeX = 50;
  const eyeOpen = Math.max(5, 20 - blink);

  ctx.fillStyle = "white";
  ctx.fillRect(cx - eyeX, eyeY, 20, eyeOpen);
  ctx.fillRect(cx + eyeX - 20, eyeY, 20, eyeOpen);
}

function animate() {
  blink += Math.random() < 0.02 ? 15 : -1;
  blink = Math.max(0, Math.min(blink, 20));
  drawFace();
  requestAnimationFrame(animate);
}
animate();

input.addEventListener("keydown", async e => {
  if (e.key === "Enter" && input.value.trim()) {
    const text = input.value;
    input.value = "";
    reply.textContent = "…";

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    mood = data.mood;
    reply.textContent = data.reply;
  }
});
