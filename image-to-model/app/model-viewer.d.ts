import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          "auto-rotate"?: boolean | string;
          "camera-controls"?: boolean | string;
          "shadow-intensity"?: string | number;
          "shadow-softness"?: string | number;
          "tone-mapping"?: string;
          exposure?: string | number;
          "interaction-prompt"?: string;
          "environment-image"?: string;
          poster?: string;
          loading?: string;
          reveal?: string;
          ar?: boolean | string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }

  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "model-viewer": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement> & {
            src?: string;
            alt?: string;
            "auto-rotate"?: boolean | string;
            "camera-controls"?: boolean | string;
            "shadow-intensity"?: string | number;
            "shadow-softness"?: string | number;
            "tone-mapping"?: string;
            exposure?: string | number;
            "interaction-prompt"?: string;
            "environment-image"?: string;
            poster?: string;
            loading?: string;
            reveal?: string;
            ar?: boolean | string;
            style?: React.CSSProperties;
          },
          HTMLElement
        >;
      }
    }
  }
}
