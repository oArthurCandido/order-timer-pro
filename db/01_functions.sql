-- Functions and Triggers for Order Timer Pro
-- Version: 1.0.0

-- Function to handle order queue position changes
CREATE OR REPLACE FUNCTION reorder_queue_positions()
RETURNS TRIGGER AS $$
DECLARE
    current_position INTEGER;
BEGIN
    -- Se for uma inserção, coloca o pedido no final da fila
    IF TG_OP = 'INSERT' THEN
        SELECT COALESCE(MAX(queue_position), 0) + 1
        INTO NEW.queue_position
        FROM orders
        WHERE user_id = NEW.user_id
        AND status NOT IN ('completed', 'cancelled');
        
        RETURN NEW;
    
    -- Se for uma atualização e o status mudou para completed/cancelled
    ELSIF TG_OP = 'UPDATE' AND 
          OLD.status NOT IN ('completed', 'cancelled') AND 
          NEW.status IN ('completed', 'cancelled') THEN
        
        -- Atualiza as posições dos pedidos após o removido
        UPDATE orders
        SET queue_position = queue_position - 1
        WHERE user_id = NEW.user_id
        AND status NOT IN ('completed', 'cancelled')
        AND queue_position > OLD.queue_position;
        
        -- Remove a posição do pedido completado/cancelado
        NEW.queue_position = NULL;
        
        RETURN NEW;
    
    -- Se for uma deleção
    ELSIF TG_OP = 'DELETE' THEN
        -- Atualiza as posições dos pedidos após o removido
        UPDATE orders
        SET queue_position = queue_position - 1
        WHERE user_id = OLD.user_id
        AND status NOT IN ('completed', 'cancelled')
        AND queue_position > OLD.queue_position;
        
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle order deletion and queue position updates
CREATE OR REPLACE FUNCTION public.handle_order_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only reorder if the deleted order was pending or in-progress
  IF OLD.status IN ('pending', 'in-progress') THEN
    -- Decrease queue position for all orders after the deleted one
    UPDATE public.orders
    SET queue_position = queue_position - 1,
        updated_at = NOW()
    WHERE user_id = OLD.user_id
      AND status IN ('pending', 'in-progress')
      AND queue_position > OLD.queue_position;
  END IF;
  
  RETURN OLD;
END;
$function$;

-- Function to handle production start time
CREATE OR REPLACE FUNCTION set_production_start_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para in_production e não tinha tempo de início
    IF NEW.status = 'in_production' AND OLD.status != 'in_production' THEN
        -- Se está retornando de uma pausa, não atualiza o tempo de início
        IF OLD.status != 'paused' THEN
            NEW.production_start_time = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle production time updates on pause
CREATE OR REPLACE FUNCTION update_production_time_on_pause()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o pedido foi pausado
    IF NEW.status = 'paused' AND OLD.status = 'in_production' THEN
        -- Calcula o tempo decorrido desde o início/última pausa
        NEW.total_production_time = COALESCE(OLD.total_production_time, 0) + 
            EXTRACT(EPOCH FROM (NOW() - OLD.production_start_time))::INTEGER;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to finalize production time on completion
CREATE OR REPLACE FUNCTION finalize_production_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o pedido foi completado
    IF NEW.status = 'completed' AND OLD.status = 'in_production' THEN
        NEW.production_end_time = NOW();
        NEW.total_production_time = COALESCE(OLD.total_production_time, 0) + 
            EXTRACT(EPOCH FROM (NEW.production_end_time - OLD.production_start_time))::INTEGER;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER manage_queue_positions
    BEFORE INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION reorder_queue_positions();

CREATE TRIGGER on_order_delete
  BEFORE DELETE
  ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_deletion();

CREATE TRIGGER set_start_time
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_production_start_time();

CREATE TRIGGER update_paused_time
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_production_time_on_pause();

CREATE TRIGGER finalize_time
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION finalize_production_time(); 