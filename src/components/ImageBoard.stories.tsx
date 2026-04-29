import type { Meta, StoryObj } from "@storybook/react-vite";
import { ImageBoard } from "./ImageBoard";
import type { BoardSlot, Image } from "../appState";

const meta = {
  component: ImageBoard,
  parameters: {
    layout: "centered",
  },
  title: "Design System/ImageBoard",
} satisfies Meta<typeof ImageBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    images: createBoard(),
  },
};

export const PartiallyFilled: Story = {
  args: {
    images: createBoard([
      createSampleImage(1, "%230f766e"),
      null,
      createSampleImage(3, "%23b4233a"),
    ]),
  },
};

export const Full: Story = {
  args: {
    images: createBoard([
      createSampleImage(1, "%230f766e"),
      createSampleImage(2, "%232563eb"),
      createSampleImage(3, "%23b4233a"),
      createSampleImage(4, "%239a6b15"),
      createSampleImage(5, "%232d7f5e"),
      createSampleImage(6, "%23605f7e"),
      createSampleImage(7, "%23162033"),
      createSampleImage(8, "%23d5dde2"),
      createSampleImage(9, "%23f5f7f1"),
    ]),
  },
};

function createBoard(images: readonly BoardSlot[] = []): BoardSlot[] {
  return Array.from({ length: 9 }, (_, index) => images[index] ?? null);
}

function createSampleImage(index: number, encodedColor: string): Image {
  return {
    altText: `Sample board color ${index}`,
    dataUrl: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='${encodedColor}'/%3E%3C/svg%3E`,
    id: `sample-${index}`,
    mimeType: "image/svg+xml",
    name: `sample-${index}.svg`,
  };
}
