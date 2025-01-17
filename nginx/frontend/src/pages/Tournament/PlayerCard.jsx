import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

const PlayerCard = ({ player, onUpdate, index, isDisabled }) => {
    const [imagePreview, setImagePreview] = useState(null);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
                onUpdate({ ...player, image: e.target.result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="card bg-gray-900 p-6 rounded-lg text-center w-full flex flex-col items-center hover-glow">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-4 bg-gray-800">
                {imagePreview || player.image ? (
                    <img
                        src={imagePreview || player.image}
                        alt="Player"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <label className="cursor-pointer hover:text-cyan-400 transition-colors duration-300">
                            <Upload className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
                            <div className="text-xs">Upload</div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}
            </div>
            <Input
                type="text"
                placeholder="Enter nickname"
                disabled={isDisabled}
                value={player.nickname || ''}
                onChange={(e) => onUpdate({ ...player, nickname: e.target.value })}
                className="bg-gray-800 border-cyan-500/30 text-cyan-400 placeholder-cyan-700
                    focus:border-cyan-400 focus:ring-cyan-400/50 mb-2 max-w-[200px]"
            />
            <div className="text-sm text-cyan-400">Player {index + 1}</div>
        </div>
    );
};

export default PlayerCard;