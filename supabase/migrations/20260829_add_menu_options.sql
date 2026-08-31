-- Add options column to cart_items to store menu customizations like sauce/toppings
ALTER TABLE IF EXISTS cart_items
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT NULL;

-- Add options column to order_items to preserve selected options
ALTER TABLE IF EXISTS order_items
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT NULL;

-- Create a menu_options table to define available options for each menu
CREATE TABLE IF NOT EXISTS menu_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  option_name VARCHAR(100) NOT NULL,
  option_type VARCHAR(50) NOT NULL, -- 'sauce', 'topping', 'variant'
  values TEXT[] NOT NULL, -- Array of available values
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(menu_id, option_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_menu_options_menu_id ON menu_options(menu_id);
