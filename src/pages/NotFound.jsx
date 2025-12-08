import React from "react";
import { TbError404 } from "react-icons/tb";
import { BiSolidError } from "react-icons/bi";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 w-full min-h-screen flex justify-center items-center flex-col"
    >
      <BiSolidError className="text-red-600" size={100} /> Page not found
    </motion.div>
  );
}
