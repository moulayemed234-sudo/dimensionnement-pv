/** Save a project to a JSON file and open one again. */
import { isProjectData, type ProjectData } from '../state/projectStore';

const FILE_KIND = 'offgrid-pv-sizing';

/** Downloads the project as "<project name>.json". */
export function downloadProject(project: ProjectData): void {
  const payload = { kind: FILE_KIND, version: 1, savedAt: new Date().toISOString(), project };
  // JSON has no NaN; empty fields are written as null and read back as empty.
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileName = project.info.name.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'projet-pv';
  link.href = url;
  link.download = `${fileName}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Reads a project file; null when it isn't a project this app can open. */
export async function readProjectFile(file: File): Promise<ProjectData | null> {
  try {
    const parsed: unknown = JSON.parse(await file.text());
    const candidate = typeof parsed === 'object' && parsed !== null && 'project' in parsed ? parsed.project : parsed;
    return isProjectData(candidate) ? withNumbers(candidate) : null;
  } catch {
    return null;
  }
}

/** Turns the nulls JSON wrote for empty number fields back into NaN. */
function withNumbers(project: ProjectData): ProjectData {
  const num = (value: unknown) => (typeof value === 'number' ? value : Number.NaN);
  return {
    ...project,
    input: {
      ...project.input,
      appliances: project.input.appliances.map((a) => ({
        ...a,
        quantity: num(a.quantity),
        powerW: num(a.powerW),
        hoursPerDay: num(a.hoursPerDay),
      })),
    },
  };
}
