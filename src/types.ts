export interface ProjectManifest {
  title?: string;
  description?: string;
  file?: string;
  image?: string;
  video?: string;
  style?: 'win95' | 'aero' | 'flat';
  flatColors?: {
    primary: string;
    secondary: string;
  };
}

export interface Project extends ProjectManifest {
  id: string;
  category: string;
  basePath: string;
}
