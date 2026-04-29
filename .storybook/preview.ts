import type { Preview } from "@storybook/react-vite";
import "../src/index.css";
import "../src/designSystem/styles.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
};

export default preview;
