import { Loader } from "lucide-react";
import React from "react";

export const FullScreenLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader className="animate-spin" size={48} />
    </div>
  );
};
