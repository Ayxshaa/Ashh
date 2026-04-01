import React from 'react';

const About = ({ onClose }) => {
  return (
    <div className="w-full h-full overflow-y-auto pr-4">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-lg border border-purple-400/30">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>👨‍💻</span> About Me
          </h2>
          <p className="text-gray-300 leading-relaxed">
            I'm a creative developer and designer passionate about building immersive digital experiences. 
            With expertise in 3D graphics, interactive design, and modern web technologies, I create 
            experiences that push the boundaries of what's possible on the web.
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-lg border border-blue-400/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🎯</span> Expertise
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">▸</span> 3D Graphics & WebGL
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">▸</span> React & Modern JavaScript
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">▸</span> UI/UX Design
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">▸</span> Animation & Motion Design
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">▸</span> Interaction Design
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-lg border border-green-400/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🚀</span> Mission
          </h3>
          <p className="text-gray-300 leading-relaxed">
            To create beautiful, functional, and innovative digital experiences that engage users 
            and bring imagination to life. Every project is an opportunity to explore new possibilities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;