import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, FileText, Send, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { postData } from "../../Helpers/api";

const ExitIntentPopup = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
    requestDemo: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await postData("/demoResponse/submit", formData);
      if (resp.status) {
        toast.success(resp.message || "Request submitted successfully!");
        setFormData({
          name: "",
          email: "",
          company: "",
          message: "",
          requestDemo: true,
        });
        onClose();
      } else {
        toast.error(resp.message || "Something went wrong.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors z-10"
            >
              <X size={20} />
            </button>

            {/* Left Side: Branding & Info */}
            <div className="w-full md:w-[42%] bg-slate-50 p-10 md:p-16 flex flex-col">
              <div className="flex-grow">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">
                  READY TO <br />
                  <span className="text-blue-600">
                    EVOLVE
                  </span>
                  <span className="text-blue-500">?</span>
                </h2>
                <p className="text-slate-600 text-base font-medium leading-relaxed mb-8">
                  Join hundreds of industry leaders driving global transformation with Ajiva Infotech.
                </p>
              </div>

              <div className="space-y-4 mt-auto">
                {/* Contact Card 1 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group cursor-pointer hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Phone size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support</p>
                    <p className="text-slate-900 font-bold text-sm whitespace-nowrap">0172-4084189</p>
                  </div>
                </div>

                {/* Contact Card 2 */}
                <a 
                  href="/presentation.pdf" 
                  download="PIL.pdf"
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group cursor-pointer hover:shadow-md transition-all h-[68px] no-underline"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PIL</p>
                    <p className="text-blue-600 font-bold uppercase text-[12px] m-0">Download PDF</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full md:w-[58%] p-10 md:p-16 bg-white flex flex-col">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 text-center md:text-left">
                Initiate Project
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4 flex-grow flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="NAME"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="EMAIL"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="company"
                    placeholder="YOUR COMPANY"
                    required
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>
                <div className="flex-grow">
                  <textarea
                    name="message"
                    placeholder="HOW CAN WE HELP?"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full h-full min-h-[150px] px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none"
                  />
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 h-[68px] bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? "TRANSMITTING..." : "SUBMIT"}
                    {!isSubmitting && <Send size={20} />}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentPopup;
