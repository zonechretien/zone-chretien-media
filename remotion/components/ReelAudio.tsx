import { Html5Audio, Sequence, useVideoConfig } from "remotion";
import { musicVolumeAt } from "../lib/audio";
import { mediaUrl } from "../media";
import type { MusicProps, VoiceOverProps } from "../schemas";

const VOICE_HOLD_FRAMES = 15;
const VOICE_FADE_FRAMES = 9;

/**
 * Bande son commune à tous les templates : musique de fond (fondus, boucle,
 * baisse automatique pendant la voix) et voix off. Les fichiers sont servis
 * par le studio local ; sans studio (aperçu hors connexion), rien n'est joué.
 */
export function ReelAudio({
  music,
  voiceOver,
  trimStartSeconds = 0,
  voiceEndFrame = null,
  mediaBaseUrl,
}: {
  music: MusicProps | null;
  voiceOver: VoiceOverProps | null;
  /** Silence retiré au début de la voix off (voix synchronisée). */
  trimStartSeconds?: number;
  /** Voix synchronisée : image du dernier mot du texte ; la voix s'éteint juste après. */
  voiceEndFrame?: number | null;
  mediaBaseUrl?: string;
}) {
  const { fps, durationInFrames } = useVideoConfig();
  // Voix raccourcie de son silence initial : la musique ne baisse que pendant la parole.
  // Voix synchronisée, éteinte après son dernier mot : la musique remonte dès ce moment.
  const voice =
    voiceOver && voiceEndFrame !== null
      ? { ...voiceOver, mediaDurationSeconds: (voiceEndFrame - Math.round(voiceOver.startSeconds * fps) + VOICE_HOLD_FRAMES) / fps }
      : voiceOver && trimStartSeconds > 0 && voiceOver.mediaDurationSeconds
        ? { ...voiceOver, mediaDurationSeconds: Math.max(0.1, voiceOver.mediaDurationSeconds - trimStartSeconds) }
        : voiceOver;
  const musicSrc = music ? mediaUrl(music.path, mediaBaseUrl) : null;
  const voiceSrc = voiceOver ? mediaUrl(voiceOver.path, mediaBaseUrl) : null;

  return (
    <>
      {music && musicSrc ? (
        <Html5Audio
          src={musicSrc}
          loop
          // La courbe de volume continue d'une boucle à l'autre (fondu de sortie sur la fin du Reel).
          loopVolumeCurveBehavior="extend"
          volume={(frame) => musicVolumeAt(frame, { music, totalFrames: durationInFrames, fps, voice })}
        />
      ) : null}
      {voiceOver && voiceSrc ? (
        <Sequence from={Math.round(voiceOver.startSeconds * fps)} layout="none">
          <Html5Audio
            src={voiceSrc}
            // Après le dernier mot du texte (+ 0,5 s), fondu de 0,3 s : ce qui a été dit
            // avant l'arrêt de l'enregistrement (« c'est bon ? », rires) n'est pas entendu.
            volume={
              voiceEndFrame === null
                ? voiceOver.volume
                : (f) => voiceOver.volume * Math.min(1, Math.max(0, (voiceEndFrame - Math.round(voiceOver.startSeconds * fps) + VOICE_HOLD_FRAMES + VOICE_FADE_FRAMES - f) / VOICE_FADE_FRAMES))
            }
            trimBefore={trimStartSeconds > 0 ? Math.round(trimStartSeconds * fps) : undefined}
            // Voix plus grave : hauteur baissée par ffmpeg au rendu, durée inchangée
            // (asetrate + atempo) ; sans effet dans l'aperçu du navigateur.
            toneFrequency={voiceOver.pitchSemitones ? 2 ** (voiceOver.pitchSemitones / 12) : undefined}
          />
        </Sequence>
      ) : null}
    </>
  );
}
