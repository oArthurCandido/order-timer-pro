-- Functions and Triggers for Order Timer Pro
-- Version: 1.0.0

-- Function to handle order queue position changes
CREATE OR REPLACE FUNCTION reorder_queue_positions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_running text;
BEGIN
  -- Get or initialize the recursion control variable
  current_running := current_setting('app.reorder_queue_running', true);
  
  -- If the trigger is already running, just return
  IF current_running = 'true' THEN
    RETURN NEW;
  END IF;

  -- Only reorder if the status is pending or in-progress AND not changing to completed
  IF NEW.status IN ('pending', 'in-progress') AND NEW.status != 'completed' THEN
    -- If queue position has changed
    IF OLD.queue_position != NEW.queue_position THEN
      -- Set the recursion control flag
      PERFORM set_config('app.reorder_queue_running', 'true', true);
      
      BEGIN
        -- Move other orders accordingly
        IF OLD.queue_position > NEW.queue_position THEN
          -- Moving up in the queue
          UPDATE public.orders
          SET queue_position = queue_position + 1,
              updated_at = NOW()
          WHERE user_id = NEW.user_id
            AND id != NEW.id
            AND status IN ('pending', 'in-progress')
            AND queue_position >= NEW.queue_position
            AND queue_position < OLD.queue_position;
        ELSE
          -- Moving down in the queue
          UPDATE public.orders
          SET queue_position = queue_position - 1,
              updated_at = NOW()
          WHERE user_id = NEW.user_id
            AND id != NEW.id
            AND status IN ('pending', 'in-progress')
            AND queue_position <= NEW.queue_position
            AND queue_position > OLD.queue_position;
        END IF;
        
        -- Reset the recursion control flag
        PERFORM set_config('app.reorder_queue_running', 'false', true);
      EXCEPTION
        WHEN OTHERS THEN
          -- Make sure to reset the flag even if an error occurs
          PERFORM set_config('app.reorder_queue_running', 'false', true);
          RAISE;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function to handle order deletion and queue position updates
CREATE OR REPLACE FUNCTION handle_order_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    current_running text;
BEGIN
    -- Get or initialize the recursion control variable
    current_running := current_setting('app.delete_order_running', true);
    
    -- If the trigger is already running, just return
    IF current_running = 'true' THEN
        RETURN OLD;
    END IF;

    -- Set the recursion control flag
    PERFORM set_config('app.delete_order_running', 'true', true);
    
    BEGIN
        -- Update queue positions for remaining orders
        UPDATE public.orders
        SET queue_position = queue_position - 1,
            updated_at = NOW()
        WHERE user_id = OLD.user_id
            AND status IN ('pending', 'in-progress')
            AND queue_position > OLD.queue_position;

        -- Reset the recursion control flag
        PERFORM set_config('app.delete_order_running', 'false', true);
    EXCEPTION
        WHEN OTHERS THEN
            -- Make sure to reset the flag even if an error occurs
            PERFORM set_config('app.delete_order_running', 'false', true);
            RAISE;
    END;
    
    RETURN OLD;
END;
$function$;

-- Function to handle production start time
CREATE OR REPLACE FUNCTION set_production_start_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  -- When an order changes to in-progress, set the production start time
  IF NEW.status = 'in-progress' AND (OLD.status != 'in-progress' OR OLD.status IS NULL) THEN
    NEW.production_start_time = NOW();
  END IF;
  RETURN NEW;
END;
$function$;

-- Function to handle production time updates on pause
CREATE OR REPLACE FUNCTION update_production_time_on_pause()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only calculate accumulated time when changing from in-progress to pending (pausing)
  IF OLD.status = 'in-progress' AND NEW.status = 'pending' AND OLD.production_start_time IS NOT NULL THEN
    -- Add elapsed time since production start to the accumulated time
    NEW.production_time_accumulated = OLD.production_time_accumulated + 
      EXTRACT(EPOCH FROM NOW() - OLD.production_start_time)::INTEGER / 60; -- Convert to minutes
    NEW.production_start_time = NULL; -- Reset the start time when paused
  END IF;
  RETURN NEW;
END;
$function$;

-- Function to handle order completion, queue positions and production time
CREATE OR REPLACE FUNCTION handle_order_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    current_running text;
    max_position integer;
BEGIN
    -- Get or initialize the recursion control variable
    current_running := current_setting('app.complete_order_running', true);
    
    -- If the trigger is already running, just return
    IF current_running = 'true' THEN
        RETURN NEW;
    END IF;

    -- Only proceed if status is changing to completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Set the recursion control flag
        PERFORM set_config('app.complete_order_running', 'true', true);
        
        BEGIN
            -- Finalize production time if coming from in-progress
            IF OLD.status = 'in-progress' AND OLD.production_start_time IS NOT NULL THEN
                NEW.production_time_accumulated = OLD.production_time_accumulated + 
                    EXTRACT(EPOCH FROM NOW() - OLD.production_start_time)::INTEGER / 60; -- Convert to minutes
                NEW.production_start_time = NULL; -- Reset the start time
            END IF;

            -- Update queue positions for remaining orders
            UPDATE public.orders
            SET queue_position = queue_position - 1,
                updated_at = NOW()
            WHERE user_id = NEW.user_id
                AND status IN ('pending', 'in-progress')
                AND queue_position > OLD.queue_position;

            -- Get the highest queue position
            SELECT COALESCE(MAX(queue_position), 0) + 1000
            INTO max_position
            FROM public.orders
            WHERE user_id = NEW.user_id
                AND status IN ('pending', 'in-progress');

            -- Move completed order to a very high position
            NEW.queue_position = max_position;

            -- Reset the recursion control flag
            PERFORM set_config('app.complete_order_running', 'false', true);
        EXCEPTION
            WHEN OTHERS THEN
                -- Make sure to reset the flag even if an error occurs
                PERFORM set_config('app.complete_order_running', 'false', true);
                RAISE;
        END;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create triggers
CREATE TRIGGER on_order_queue_position_change
    BEFORE UPDATE OF queue_position
    ON orders
    FOR EACH ROW
    WHEN (NEW.status != 'completed')
    EXECUTE FUNCTION reorder_queue_positions();

CREATE TRIGGER on_order_delete
    BEFORE DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_deletion();

CREATE TRIGGER trigger_set_production_start_time_on_start
    BEFORE UPDATE
    ON orders
    FOR EACH ROW
    WHEN (NEW.status != 'completed')
    EXECUTE FUNCTION set_production_start_time();

CREATE TRIGGER trigger_update_production_time_on_pause
    BEFORE UPDATE
    ON orders
    FOR EACH ROW
    WHEN (NEW.status != 'completed')
    EXECUTE FUNCTION update_production_time_on_pause();

-- Trigger for handling order completion (combines completion and time finalization)
CREATE TRIGGER on_order_completion
    BEFORE UPDATE
    ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION handle_order_completion(); 