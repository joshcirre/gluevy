import { Video } from 'lucide-react';
import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    // Using Lucide Video icon wrapped in a container
    return (
        <div
            className={`flex items-center justify-center ${props.className || ''}`}
        >
            <Video className="h-full w-full" />
        </div>
    );
}
