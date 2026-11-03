import type { Plan } from '../../contracts/plan';

/** Apply a longer hold only to the requested scenes; an empty selection means all scenes. */
export function slowScenes(plan: Plan, selected: string[]): { plan: Plan; changedSceneIds: string[] } {
  if (selected.some(id => !plan.scenes.some(scene => scene.id === id))) throw new Error('A selected scene no longer exists.');
  const changedSceneIds: string[] = [];
  const scenes = plan.scenes.map(scene => {
    if (selected.length && !selected.includes(scene.id)) return scene;
    const holdMs = Math.min(1200, (scene.holdMs ?? 180) + 240);
    if (holdMs === scene.holdMs) return scene;
    changedSceneIds.push(scene.id);
    return { ...scene, holdMs };
  });
  return { plan: { ...plan, scenes }, changedSceneIds };
}
