import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const isAero = project.style === 'aero';
  const isFlat = project.style === 'flat';
  const isExtension = project.category === 'EXTENSIONS';

  const renderMedia = (className: string) => {
    if (project.video) {
      return <video src={project.video} autoPlay loop muted playsInline className={className} />;
    }
    if (project.image) {
      return <img src={project.image} alt="" className={className} />;
    }
    return null;
  };

  const renderLink = (className: string, text: string) => {
    if (!project.file) return null;
    return (
      <a 
        href={project.file} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={className}
        download={isExtension ? '' : undefined}
      >
        {text}
      </a>
    );
  };

  if (isAero) {
    return (
      <div className="style-aero flex flex-col h-full">
        <div className="aero-content flex flex-col">
          <h3 className="text-xl font-bold mb-2 drop-shadow-md">{project.title}</h3>
          <p className="text-sm mb-4 flex-grow drop-shadow-sm">{project.description}</p>
          {renderMedia("w-full h-32 object-cover rounded mb-4 border border-white/30")}
          {renderLink("aero-btn mt-auto no-underline", isExtension ? "Скачать" : "Открыть")}
        </div>
      </div>
    );
  }

  if (isFlat) {
    const flatStyle = project.flatColors ? {
      backgroundColor: project.flatColors.primary,
      color: project.flatColors.secondary,
      borderColor: project.flatColors.secondary,
      boxShadow: `8px 8px 0px ${project.flatColors.secondary}`
    } : {};

    const btnStyle = project.flatColors ? {
      backgroundColor: project.flatColors.secondary,
      color: project.flatColors.primary,
      borderColor: project.flatColors.secondary,
    } : {};

    return (
      <div className="style-flat flex flex-col h-full" style={flatStyle}>
        <h3 className="text-xl font-bold mb-2 uppercase">{project.title}</h3>
        <p className="text-sm mb-4 flex-grow">{project.description}</p>
        {renderMedia("w-full h-32 object-cover border-2 mb-4")}
        {project.file && (
          <a 
            href={project.file} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="style-flat-btn mt-auto no-underline"
            style={btnStyle}
            download={isExtension ? '' : undefined}
          >
            {isExtension ? "СКАЧАТЬ" : "ОТКРЫТЬ"}
          </a>
        )}
      </div>
    );
  }

  // Default Win95 style
  return (
    <div className="win95-window flex flex-col h-full">
      <div className="win95-titlebar">
        <span>{project.title}</span>
        <div className="flex gap-1">
          <button className="win95-btn-small">_</button>
          <button className="win95-btn-small">□</button>
          <button className="win95-btn-small">×</button>
        </div>
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <div className="win95-inset bg-white dark:bg-[#1a1a1a] p-2 mb-4 flex-grow">
          <p className="text-sm">{project.description}</p>
        </div>
        {(project.video || project.image) && (
          <div className="win95-inset mb-4 p-1">
            {renderMedia("w-full h-32 object-cover")}
          </div>
        )}
        {renderLink("win95-btn mt-auto no-underline", isExtension ? "Скачать файл" : "Открыть файл")}
      </div>
    </div>
  );
}
