import { I18n } from '@iobroker/gui-components';
import { Box, Checkbox, FormControlLabel, Paper, Typography } from '@mui/material';
import React from 'react';
import { productConfig, type Products } from './Products';

interface ProductSelectorProps {
    products: Products;
    onChange: (products: Products) => void;
    disabled?: boolean;
    availableProducts?: Partial<Products>; // Definiert welche Produkte für diese Station/Journey verfügbar sind
    nativeProducts?: Partial<Products>; // Von HAFAS gemeldete Produkte – werden unterstrichen dargestellt
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
    products,
    onChange,
    disabled = false,
    availableProducts,
    nativeProducts,
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
                                checked={products[key] ?? true}
                                onChange={e => handleChange(key, e.target.checked)}
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
                                    sx={nativeProducts?.[key] ? { textDecoration: 'underline' } : undefined}
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
