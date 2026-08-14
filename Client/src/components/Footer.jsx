import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="glass h-12 flex items-center justify-center border-t border-ink-200/60 text-sm text-ink-500">
      <p>
        All Copyright Reserved &copy;{" "}
        <Link
          to="https://protfolio-shailesh-full-stack-developer.vercel.app/"
          className="text-brand-600 hover:text-brand-700 transition-colors font-semibold"
          target="_blank"
          rel="noopener noreferrer">
          Shailesh Kale
        </Link>
      </p>
    </footer>
  );
};

export default Footer;
