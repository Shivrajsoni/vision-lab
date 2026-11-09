import type { RoadmapLevel } from "./types";

/** The learning path. Lessons attach to topics as content lands; adding a level is adding an entry. */
export const ROADMAP: RoadmapLevel[] = [
  {
    level: 1,
    title: "Foundations",
    goal: "Understand an image as numbers and a filter as arithmetic on those numbers.",
    topics: ["Digital images and pixels", "RGB and channels", "Convolutions and filters", "CNNs", "Pooling", "Activation functions", "Backpropagation"],
  },
  {
    level: 2,
    title: "Classical deep architectures",
    goal: "Follow how networks grew deeper and why each step worked.",
    topics: ["LeNet", "AlexNet", "VGG", "ResNet", "Inception", "EfficientNet"],
  },
  {
    level: 3,
    title: "Modern computer vision",
    goal: "See how attention, detection and segmentation models read a scene.",
    topics: ["Vision Transformers", "Swin Transformers", "DETR", "YOLO", "U-Net", "Mask R-CNN", "Segment Anything"],
  },
  {
    level: 4,
    title: "Generative models",
    goal: "Learn how a model turns noise or a latent code into an image.",
    topics: ["Autoencoders", "VAEs", "GANs", "Diffusion models", "DDPM", "DDIM", "Latent diffusion", "Stable Diffusion"],
  },
  {
    level: 5,
    title: "Multimodal AI",
    goal: "Connect images and language in one representation.",
    topics: ["Embeddings", "Contrastive learning", "CLIP", "BLIP", "Vision encoders", "Vision-language alignment", "Multimodal LLMs", "Visual reasoning"],
  },
  {
    level: 6,
    title: "Advanced research",
    goal: "Read current papers and know what it takes to run them.",
    topics: ["State-of-the-art architectures", "Efficient inference", "Quantization", "Multimodal agents", "Video understanding", "Recent papers"],
  },
];
