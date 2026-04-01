import React from 'react';
import { X } from 'lucide-react';

const Projects = ({ onClose }) => {
  const projects = [
    {
      id: 1,
      title: "Moon Portfolio Experience",
      description: "An immersive 3D interactive portfolio built with Three.js and React.",
      tech: ["Three.js", "React", "Framer Motion"],
      icon: "🚀"
    },
    {
      id: 2,
      title: "Lunar Surface Explorer",
      description: "Interactive exploration game on a procedurally generated moon surface.",
      tech: ["Three.js", "WebGL", "Physics"],
      icon: "🌙"
    },
    {
      id: 3,
      title: "Space Journey Animation",
      description: "Cinematic animation system with smooth camera transitions and effects.",
      tech: ["Three.js", "WebGL", "Animation"],
      icon: "✨"
    }
  ];

  return (
    <div className="w-full h-full overflow-y-auto pr-4">
      <div className="space-y-3">
        {projects.map((project) => (
          <div 
            key={project.id}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-lg border border-blue-400/30 hover:border-blue-400/60 transition-all hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{project.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{project.title}</h3>
                <p className="text-gray-300 text-sm mt-1">{project.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {project.tech.map((tech) => (
                    <span 
                      key={tech}
                      className="px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;