// Type declaration for lucide-react-native
// This file tells TypeScript to accept imports from lucide-react-native
// even though the package doesn't include its own type definitions.

declare module 'lucide-react-native' {
    import { FC } from 'react';
    import { SvgProps } from 'react-native-svg';

    export interface IconProps extends SvgProps {
        size?: number | string;
        color?: string;
        strokeWidth?: number | string;
    }

    export type Icon = FC<IconProps>;

    // Export all icons as Icon type
    export const Activity: Icon;
    export const AlertCircle: Icon;
    export const AlertTriangle: Icon;
    export const ArrowDown: Icon;
    export const ArrowLeft: Icon;
    export const ArrowRight: Icon;
    export const ArrowUp: Icon;
    export const BarChart: Icon;
    export const BarChart2: Icon;
    export const BarChart3: Icon;
    export const Battery: Icon;
    export const Bell: Icon;
    export const Book: Icon;
    export const Calendar: Icon;
    export const Check: Icon;
    export const CheckCircle: Icon;
    export const ChevronDown: Icon;
    export const ChevronLeft: Icon;
    export const ChevronRight: Icon;
    export const ChevronUp: Icon;
    export const Circle: Icon;
    export const Clock: Icon;
    export const Download: Icon;
    export const DollarSign: Icon;
    export const Edit: Icon;
    export const Eye: Icon;
    export const FileText: Icon;
    export const Filter: Icon;
    export const Flame: Icon;
    export const Home: Icon;
    export const Info: Icon;
    export const Lightbulb: Icon;
    export const LineChart: Icon;
    export const List: Icon;
    export const Loader: Icon;
    export const Mail: Icon;
    export const Menu: Icon;
    export const Minus: Icon;
    export const Moon: Icon;
    export const MoreHorizontal: Icon;
    export const MoreVertical: Icon;
    export const PenTool: Icon;
    export const PieChart: Icon;
    export const Plus: Icon;
    export const Power: Icon;
    export const RefreshCw: Icon;
    export const Save: Icon;
    export const Search: Icon;
    export const Settings: Icon;
    export const Share: Icon;
    export const Sparkles: Icon;
    export const Star: Icon;
    export const Sun: Icon;
    export const Thermometer: Icon;
    export const Trash: Icon;
    export const Trash2: Icon;
    export const TrendingDown: Icon;
    export const TrendingUp: Icon;
    export const User: Icon;
    export const Users: Icon;
    export const X: Icon;
    export const XCircle: Icon;
    export const Zap: Icon;
    export const ZapOff: Icon;

    // Catch-all for any other icons
    const icons: { [key: string]: Icon };
    export default icons;
}
