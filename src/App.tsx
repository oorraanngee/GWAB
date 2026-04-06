import { useState, useEffect } from 'react';
import { ProjectCard } from './components/ProjectCard';
import { Project, ProjectManifest } from './types';

// Vite glob import for the manifests
const manifestModules = import.meta.glob('/public/{HTML,SITES,EXTENSIONS}/*/manifest.json', { eager: true });

const projects: Project[] = Object.entries(manifestModules).map(([path, module]: [string, any]) => {
  const parts = path.split('/');
  const category = parts[2]; // HTML, SITES, or EXTENSIONS
  const folderName = parts[3];
  const basePath = `/${category}/${folderName}`;
  
  const manifest = module.default || module;

  return {
    id: `${category}-${folderName}`,
    category,
    basePath,
    title: manifest.title || folderName,
    description: manifest.description || '',
    file: manifest.file ? `${basePath}/${manifest.file}` : undefined,
    image: manifest.image ? `${basePath}/${manifest.image}` : undefined,
    video: manifest.video ? `${basePath}/${manifest.video}` : undefined,
    style: manifest.style || 'win95'
  };
});

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const filtered = filter === 'all' ? projects : projects.filter(p => p.category === filter);

  return (
    <div className="min-h-screen win95-desktop p-4 md:p-8">
      {/* Main Window */}
      <div className="win95-window mb-8 max-w-5xl mx-auto">
        <div className="win95-titlebar">
          <span>GWAB.exe</span>
          <div className="flex gap-1">
            <button className="win95-btn-small" onClick={toggleTheme} title="Сменить тему">
              {theme === 'light' ? '☽' : '☀'}
            </button>
            <button className="win95-btn-small">_</button>
            <button className="win95-btn-small">(:<</button>
            <button className="win95-btn-small">>:)</button>
          </div>
        </div>
        
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="win95-inset p-4 flex-1">
              <h1 className="text-2xl font-bold mb-2">Мои работы:</h1>
              <p className="mb-2">
                Добро пожаловать на глаб!
              </p>
              <ul className="list-disc list-inside mb-4 ml-2">
                <li>Вы можете тут: скачать расширение (в формате.zip).</li>
                <li>Вы можете тут: открыть мой html сайт.</li>
                <li>Вы можете тут: найди мои сайты и перейти на них.</li>
              </ul>
              <p className="text-sm italic text-gray-500">
                Весь код сайтов защищён. Html и расширения можно изменять. Всё сделано бесплатно, включая хостинг сайта. 
                Связаться со мной вы можете по почте <a href="https://mail.google.com/mail/?view=cm&fs=1&to=am2004idd@gmail.com&su=Тема&body=Текст" className="underline hover:text-blue-600">am2004idd@gmail.com</a>
              </p>
            </div>
            
            <div className="win95-inset p-4 w-full md:w-48 shrink-0">
              <h2 className="font-bold mb-2 border-b border-black dark:border-white pb-1">Фильтры</h2>
              <div className="flex flex-col gap-2">
                <button className={`win95-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Все проекты</button>
                <button className={`win95-btn ${filter === 'HTML' ? 'active' : ''}`} onClick={() => setFilter('HTML')}>HTML</button>
                <button className={`win95-btn ${filter === 'SITES' ? 'active' : ''}`} onClick={() => setFilter('SITES')}>Сайты</button>
                <button className={`win95-btn ${filter === 'EXTENSIONS' ? 'active' : ''}`} onClick={() => setFilter('EXTENSIONS')}>Расширения</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
      </div>

      {filtered.length === 0 && (
        <div className="max-w-5xl mx-auto win95-window p-8 text-center mt-8">
          <h2 className="text-xl font-bold mb-2">Проекты не найдены</h2>
          <p>В папке <code>public/</code> пока нет проектов или они не соответствуют фильтру.</p>
        </div>
      )}
    </div>
  );
}
