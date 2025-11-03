import { useNavigate } from "@tanstack/react-router";

const Introduction = () => {
  const navigate = useNavigate();

  const handlePortfolioClick = () => {
    navigate({ to: "/app" });
  };
  return (
    <>
      <section
        className="intro-banner"
        style={{ width: "100vw", height: "100vh" }}
      >
        <h1>Kent Hudson Caparas</h1>
        <p>Full-Stack Engineer | AI Enthusiast | Tech Junkie </p>
      </section>
      <section
        className="intro-description"
        style={{ width: "100vw", height: "100vh" }}
      >
        <p>
          Pleased to meet you, I'm a Full-Stack Engineer based in Victoria, B.C.
          Canada. I enjoy building everything across the full stack, but what
          I'm most passionate about is creating something impactful and
          user-facing
        </p>
      </section>
      <section
        className="intro-buttons"
        style={{ width: "100vw", height: "100vh" }}
      >
        <div>
          <h2>So now that we've met. View my Portfolio or Contact Me</h2>
          <button onClick={handlePortfolioClick}>Portfolio</button>
          <button onClick={() => (window.location.href = "#contact")}>
            Contact Me
          </button>
        </div>
      </section>
    </>
  );
};

export default Introduction;
