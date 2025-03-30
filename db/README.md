# Order Timer Pro - Database Setup

Este diretório contém os scripts SQL necessários para configurar o banco de dados do Order Timer Pro no Supabase.

## Estrutura dos Arquivos

- `00_schema.sql`: Contém a definição das tabelas, extensões e políticas de segurança
- `01_functions.sql`: Contém todas as funções e triggers do sistema

## Ordem de Execução

Os scripts devem ser executados na seguinte ordem:

1. `00_schema.sql`
2. `01_functions.sql`

## Como Instalar

1. Acesse o painel de administração do Supabase
2. Vá para o SQL Editor
3. Execute os scripts na ordem especificada acima
4. Verifique se não houve erros na execução

## Verificação da Instalação

Após a execução dos scripts, você pode verificar se tudo foi instalado corretamente:

1. Verifique se as tabelas foram criadas:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

2. Verifique se as funções foram criadas:
   ```sql
   SELECT proname 
   FROM pg_proc 
   WHERE pronamespace = 'public'::regnamespace;
   ```

3. Verifique se os triggers estão ativos:
   ```sql
   SELECT tgname, tgenabled 
   FROM pg_trigger 
   WHERE tgrelid = 'public.orders'::regclass;
   ```

## Estrutura do Banco de Dados

### Tabelas

1. `profiles`: Armazena informações dos usuários
2. `production_settings`: Configurações de produção por usuário
3. `orders`: Pedidos e suas informações de produção

### Funções Principais

1. `reorder_queue_positions()`: Gerencia a posição dos pedidos na fila
2. `handle_order_deletion()`: Atualiza a fila quando um pedido é removido
3. `set_production_start_time()`: Define o tempo de início da produção
4. `update_production_time_on_pause()`: Atualiza o tempo quando um pedido é pausado
5. `finalize_production_time()`: Finaliza o tempo de produção de um pedido

### Políticas de Segurança

Todas as tabelas têm políticas RLS (Row Level Security) configuradas para garantir que os usuários só possam acessar seus próprios dados.

## Solução de Problemas

Se encontrar algum erro durante a instalação:

1. Verifique se todos os scripts foram executados na ordem correta
2. Verifique se não há objetos conflitantes no banco de dados
3. Verifique se todas as extensões necessárias estão instaladas
4. Verifique se o usuário tem as permissões necessárias

Para mais informações ou suporte, consulte a documentação do projeto. 