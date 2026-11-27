import { StatusBadge, formatMoney } from '../../components/ui.jsx';

export const status = (value) => <StatusBadge value={value} />;
export const money = (value) => formatMoney(value);
