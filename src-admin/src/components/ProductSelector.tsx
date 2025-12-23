import { I18n } from '@iobroker/adapter-react-v5';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import DirectionsRailwayIcon from '@mui/icons-material/DirectionsRailway';
import SubwayIcon from '@mui/icons-material/Subway';
import TrainIcon from '@mui/icons-material/Train';
import TramIcon from '@mui/icons-material/Tram';
import { Box, Checkbox, FormControlLabel, Paper, Typography } from '@mui/material';
import React from 'react';

export interface Products {
    suburban?: boolean;
    subway?: boolean;
    tram?: boolean;
    bus?: boolean;
    ferry?: boolean;
    regional?: boolean;
    regionalExpress?: boolean;
    nationalExpress?: boolean;
    national?: boolean;
}

export const defaultProducts: Products = {
    suburban: true,
    subway: true,
    tram: true,
    bus: true,
    ferry: true,
    regional: true,
    regionalExpress: true,
    nationalExpress: true,
    national: true,
};

/**
 * Filtert availableProducts und behält nur Keys mit true Werten
 *
 * @param products - Die zu filternden Produkte
 * @returns Gefilterte Produkte nur mit true Werten
 */
export const filterAvailableProducts = (products?: Partial<Products>): Partial<Products> | undefined => {
    if (!products) {
        return undefined;
    }

    const filtered: Partial<Products> = {};
    Object.entries(products).forEach(([key, value]) => {
        if (value === true) {
            filtered[key as keyof Products] = true;
        }
    });

    return Object.keys(filtered).length > 0 ? filtered : undefined;
};

interface ProductSelectorProps {
    products: Products;
    onChange: (products: Products) => void;
    disabled?: boolean;
    availableProducts?: Partial<Products>; // Definiert welche Produkte für diese Station/Journey verfügbar sind
}

const productConfig = [
    { key: 'nationalExpress', label: 'ice', icon: DirectionsRailwayIcon, color: '#FF6F00' },
    { key: 'national', label: 'ic_ec', icon: DirectionsRailwayIcon, color: '#EC0016' },
    { key: 'regionalExpress', label: 're', icon: TrainIcon, color: '#0A3D62' },
    { key: 'regional', label: 're_rb', icon: TrainIcon, color: '#1455C0' },
    { key: 'suburban', label: 's_bahn', icon: TramIcon, color: '#008D4F' },
    { key: 'subway', label: 'u_bahn', icon: SubwayIcon, color: '#0065AE' },
    { key: 'tram', label: 'tram', icon: TramIcon, color: '#D5001C' },
    { key: 'bus', label: 'bus', icon: DirectionsBusIcon, color: '#A5027D' },
    { key: 'ferry', label: 'ferry', icon: DirectionsBoatIcon, color: '#0080C8' },
] as const;

const ProductSelector: React.FC<ProductSelectorProps> = ({
    products,
    onChange,
    disabled = false,
    availableProducts,
}) => {
    const handleChange = (key: keyof Products, checked: boolean): void => {
        onChange({ ...products, [key]: checked });
    };

    // Filtere nur die Produkte, die in availableProducts definiert sind
    const visibleProducts = availableProducts
        ? productConfig.filter(({ key }) => key in availableProducts)
        : productConfig;

    return (
        <Paper
            variant="outlined"
            sx={{ p: 2 }}
        >
            <Typography
                variant="subtitle2"
                sx={{ mb: 1 }}
            >
                {I18n.t('transport_types')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {visibleProducts.map(({ key, label, icon: Icon, color }) => (
                    <FormControlLabel
                        key={key}
                        disabled={disabled}
                        control={
                            <Checkbox
                                checked={products[key as keyof Products] ?? true}
                                onChange={e => handleChange(key as keyof Products, e.target.checked)}
                                sx={{ color, '&.Mui-checked': { color } }}
                                size="small"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Icon sx={{ color: disabled ? 'grey.500' : color, fontSize: 20 }} />
                                <Typography
                                    variant="body2"
                                    color={disabled ? 'text.disabled' : 'text.primary'}
                                >
                                    {I18n.t(label)}
                                </Typography>
                            </Box>
                        }
                    />
                ))}
            </Box>
        </Paper>
    );
};

export default ProductSelector;
