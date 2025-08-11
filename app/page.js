'use client'
import BlogList from "@/Components/BlogList";
import ChatWidget from "@/Components/ChatWidget";
import Footer from "@/Components/Footer";
import Header from "@/Components/Header";
import { ToastContainer } from "react-toastify";

export default function Home() {
  return (
   <>
    <Header/>
    <BlogList/>
    <ChatWidget/>
    <Footer/>
    <ToastContainer />
   </>
  );
}
