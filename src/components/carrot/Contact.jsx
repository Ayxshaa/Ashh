import React from 'react';
import { Mail, Github, Linkedin, Twitter, ExternalLink } from 'lucide-react';

const Contact = ({ onClose }) => {
  const contactLinks = [
    {
      id: 1,
      icon: Mail,
      label: "Email",
      value: "hello@ashspace.dev",
      link: "mailto:hello@ashspace.dev",
      color: "from-red-500/20 to-pink-500/20",
      borderColor: "border-red-400/30"
    },
    {
      id: 2,
      icon: Github,
      label: "GitHub",
      value: "@ashspace",
      link: "https://github.com",
      color: "from-gray-500/20 to-slate-500/20",
      borderColor: "border-gray-400/30"
    },
    {
      id: 3,
      icon: Linkedin,
      label: "LinkedIn",
      value: "in/ashspace",
      link: "https://linkedin.com",
      color: "from-blue-500/20 to-blue-600/20",
      borderColor: "border-blue-400/30"
    },
    {
      id: 4,
      icon: Twitter,
      label: "Twitter",
      value: "@ashspace_dev",
      link: "https://twitter.com",
      color: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-400/30"
    }
  ];

  return (
    <div className="w-full h-full overflow-y-auto pr-4">
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-6 rounded-lg border border-orange-400/30">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <span>📬</span> Get In Touch
          </h2>
          <p className="text-gray-300">Let's collaborate and create something amazing together!</p>
        </div>

        {contactLinks.map((item) => {
          const IconComponent = item.icon;
          return (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`bg-gradient-to-r ${item.color} p-4 rounded-lg border ${item.borderColor} hover:border-white/50 transition-all hover:shadow-lg cursor-pointer group block`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl group-hover:scale-110 transition-transform">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400">{item.label}</p>
                  <p className="text-white font-semibold">{item.value}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </a>
          );
        })}

        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-6 rounded-lg border border-indigo-400/30 mt-6">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>💬</span> Message
          </h3>
          <textarea
            className="w-full bg-black/30 border border-indigo-400/30 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400/60 resize-none"
            rows="4"
            placeholder="Leave a message..."
          />
          <button className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors">
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contact;