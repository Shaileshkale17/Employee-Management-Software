import React from "react";
import { toast } from "react-toastify";

const Text = () => {
  const notify = () => toast("Wow so easy!");

  return (
    <div>
      <button onClick={notify}>Notify!</button>
    </div>
  );
};

export default Text;
