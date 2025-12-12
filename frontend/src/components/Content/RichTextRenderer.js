import React from 'react';
import TextBlock from './blocks/TextBlock';
import ImageBlock from './blocks/ImageBlock';
import VideoBlock from './blocks/VideoBlock';
import AudioBlock from './blocks/AudioBlock';
import GalleryBlock from './blocks/GalleryBlock';
import SocialBlock from './blocks/SocialBlock';
import TelegramBlock from './blocks/TelegramBlock';
import YouTubeBlock from './blocks/YouTubeBlock';
import FAQBlock from './blocks/FAQBlock';
import HeroBlock from './blocks/HeroBlock';
import './RichTextRenderer.css';

const RichTextRenderer = ({ content, className = '' }) => {
  if (!content || !content.blocks || !Array.isArray(content.blocks)) {
    return <div className="rich-text-error">Контент недоступний</div>;
  }

  const renderBlock = (block, index) => {
    const blockProps = {
      key: `block-${index}`,
      data: block,
      index: index
    };

    switch (block.type) {
      case 'text':
        return <TextBlock {...blockProps} />;
      case 'image':
        return <ImageBlock {...blockProps} />;
      case 'video':
        return <VideoBlock {...blockProps} />;
      case 'audio':
        return <AudioBlock {...blockProps} />;
      case 'gallery':
        return <GalleryBlock {...blockProps} />;
      case 'social':
        return <SocialBlock {...blockProps} />;
      case 'telegram':
        return <TelegramBlock {...blockProps} />;
      case 'youtube':
        return <YouTubeBlock {...blockProps} />;
      case 'faq':
        return <FAQBlock {...blockProps} />;
      case 'hero':
        return <HeroBlock {...blockProps} />;
      default:
        console.warn(`Невідомий тип блоку: ${block.type}`);
        return (
          <div key={`unknown-${index}`} className="rich-text-unknown-block">
            <p>Невідомий тип блоку: {block.type}</p>
          </div>
        );
    }
  };

  return (
    <div className={`rich-text-renderer ${className}`}>
      {content.blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

export default RichTextRenderer;