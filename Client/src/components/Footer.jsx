import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="h-12 flex items-center justify-center bg-white border-t border-gray-200 text-sm text-gray-500">
      <p>
        All Copyright Reserved &copy;{" "}
        <Link
          to="https://protfolio-shailesh-full-stack-developer.vercel.app/"
          className="text-brand-600 hover:text-brand-700 transition-colors font-medium"
          target="_blank"
          rel="noopener noreferrer">
          Shailesh Kale
        </Link>
      </p>
    </footer>
  );
};

export default Footer;
