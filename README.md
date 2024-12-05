# Teste-Cobuccio-Othon
Repositório de uma API de aplicações financeiras em Nest.js como parte do teste de admissão da Cobuccio.

## Descrição
Uma aplicação com Backend e Banco de Dados de transações bancárias desenvolvida em Node.js, usando Nest.js e TypeORM no Backend e Mysql, como parte do teste de admissão da Cobuccio.

## Tecnologias Utilizadas
- **Node.js**: Stack principal da aplicação.
- **Nest.js**: Biblioteca para criação e gerenciamento de endpoints.
- **MySQL**: Banco de dados utilizado para persistência.
- **TypeORM**: "_Object Relational Mapping_" para interagir com o banco de dados de forma mais simples.
- **Jest**: Biblioteca para criação e execução de testes automatizados.

## Arquitetura Utilizada
- **Arquitetura modular padrão do Nest.js**: Utilizei aqui o formato fornecido pelo próprio Nest.js como padrão, de acordo com os comandos de geração de cada módulo (Nest generate module | controller | service <nome>).

## Funcionalidades
A API permite realizar as seguintes operações:
- **Criar um Usuário**: Feito através da inserção de dados normalmente solcitados por Instituições Financeiras.
- **Pesquisar um Usuário**: Através da inserção do CPF.
- **Criação de Wallets**: Cada Wallet relacionada a um único usuário.
- **Consulta de Wallet**: Feita através do ID de determinada wallet e pelo CPF do usuário.
- **Realização de Transferência Bancária**: Feita através dos IDs das wallets de origem e destino.
- **Reversão de Transferência**: Feita através do ID da transferência solicitada.
- **Pesquisa de Transação**: Feita através do ID da transferência solicitada.


## OBSERVAÇÃO IMPORTANTE PARA O AVALIADOR:
* Criei um módulo chamado "Bacen" para simular algumas (não todas) respostas efetuadas à API do Bacen. Reconheco que no mundo real haveriam muito mais complexidades neste tipo de Aplicação, no entanto, creio que o que fiz já é capaz de atestar minha experiência prévia em Backend de aplicações financeiras com chamadas à API do Bacen.


## Instalação
Para rodar o projeto localmente, siga os passos abaixo:

1. Clone o repositório:
```bash
git clone https://github.com/othonaf/Desafio-Shopper-Othon.git
```

2. Instale as dependências:

```bash
cd api-cobuccio-othon
npm install
```
3. Inicie o compose docker:
   
```bash
docker-compose up --build
```
4. Um banco de dados com suas relativas tabelas deverão ser criados de acordo com o arquivo '_init.sql_'.
  
5. Certifique-se de que o servidor Docker foi iniciado, se não tiver sido, inici-o manualmente.

A API Backend estará disponível em http://localhost:3000.

## Exemplos de Uso:
Aqui estão alguns exemplos de como interagir com os endpoints da API.

1. Criar Usuário:

Endpoint: POST /users <br/>
Exemplo de requisição (JSON):
```json
{
    "cpf": "12345678900",
    "name": "João Silva",
    "endereco": "Rua das Flores, 123, Jardim América, São Paulo - SP",
    "telefone": "11987654321",
    "email": "joao.silva@email.com",
    "senha": "senha123456"
}
```
2. Consultar Usuário:<br/>
Endpoint: GET /users/cpf

3. Endpoint de Criar Wallets:

Endpoint: POST /wallets/create<br/>
Exemplo de requisição (JSON):
```json
{
    "user_cpf": "06265217646",
    "account_type": "savings",
    "initial_balance": 1000.00
}
```
4. Endpoint de pesequisar Wallets por Usuário: <br/>
   Endpoint: GET /wallets/user/cpf

5. Endpoint de pesequisar Wallets por ID: <br/>
   Endpoint: GET /wallets/wallet_ID   

6. Endpoint de Realizar Transferência:

Endpoint: POST /transfers <br/>
Exemplo de requisição (JSON):
```json
{
    "sourceWalletId": "03037ebb-e73d-48db-8f06-d3b398d87ec2",
    "destinationWalletId": "7b4e2df0-c55c-4e92-9d70-dd880c8e2057",
    "value": 30,
    "transferType": "PIX"
}
```

7. Endpoint de Reverter Transferência:

Endpoint: POST /transfers/reverse <br/>
Exemplo de requisição (JSON):
```json
{
    "transaction_id": "3a1091d1-4a07-4924-93a0-37c379fc5e9c",
    "value": 3,
    "reverseReason": "Matrechan."
}
```

8. Endpoint de pesequisar Transferência por ID: <br/>
   Endpoint: GET /transfers/transfer_ID 

## Testes Automatizados:

Este projeto utiliza **Jest** para testar os endpoints da API. Abaixo estão os detalhes e orientações para os arquivos de teste.

### Configuração dos Testes

Os testes estão localizados na pasta `_testes`. Certifique-se de que todas as dependências estão instaladas e o ambiente está configurado corretamente antes de executar os testes.


### Executando os Testes
Para rodar todos os testes:
**_Obs_**: Para uma melhor desenvoltura, recomendo executar os testes nos arquivos um por vez:

1. Testando as funções em 'transfer.service':
```bash
npm run test:transfer:service
```

2. Testando as funções em 'transfer.controller':
```bash
npm run test:transfer:controller
```

3. Testando as funções em 'Wallet.controller':
```bash
npm run test:wallet:controller
```

4. Testando as funções em 'Wallet.service':
```bash
npm run test:Wallet:service
```

5. Testando as funções em 'user.service':
```bash
npm run test:user:service
```

6. Testando as funções em 'user.controller':
```bash
npm run test:user:controller
```

7. Testando as funções em 'bacen.service':
```bash
npm run test:bacen:service
```

8. Testando as funções em 'bacen.controller':
```bash
npm run test:bacen:controller
```
## Arquivos de Teste:

### transfer.service.spec.ts
Este arquivo contém testes para as funções das regras de negócio (services) do módulo 'transfer', que trata transferências de saldo entre wallets.
Testes Incluídos:

   #### TransferService
      1. Deve ser definedo.

   #### fundsTransfer();
      1. Deve fazer a transferência com sucesso.
      2. Deve lançar erro se o saldo for insuficiente.
      3. Deve lançar erro se a validação do BACEN falhar.
      
   #### reversalTransaction();
      1. Deve reverter uma transação com sucesso.
      2. Deve lançar NotFoundException quando a transação não for encontrada.
      3. Deve lançar BadRequestException quando o valor solicitado do estorno for maior que o original (5 ms)

### transfer.controller.spec.ts
Este arquivo contém testes para o controlador dos endpoints do módulo 'transfer'.
Testes Incluídos:

   #### createTransfer()
      1.  Criar uma transferência com sucesso.
      2.  Lançar uma exceção em caso de erro

   #### findTransaction()
      1.  Deve retornar uma transação.
      2.  Deve lançar uma exceção em caso de erro.

   #### reverseTransfer()
      1. Deve reverter uma transferência com sucesso.
      2. Deve lançar uma exceção em caso de erro.

### wallet.service.spec.ts 
Este arquivo contém testes para as funções das regras de negócio (services) do módulo 'wallet'.
Testes Incluídos:

   #### createWallet()
      1.  Deve criar uma nova wallet com sucesso.
      2.  Deve lançar NotFoundException se o usuário não for encontrado.

   #### findWalletsByUser()
      1.  Deve retornar wallets do usuário com sucesso.
      2.  Deve lançar NotFoundException se nenhuma wallet for encontrada.

   #### findWalletById()
      1. Deve retornar a wallet com sucesso.
      2. Deve lançar NotFoundException se a wallet não for encontrada.

### wallet.controller.spec.ts 
Este arquivo contém testes para o controlador dos endpoints do módulo 'wallet'.
Testes Incluídos:

   #### createWallet()
      1.  Deve criar uma nova wallet com sucesso.

   #### getWalletsByUser()
      1.  Deve retornar wallets do usuário com sucesso.

   #### getWalletById()
      1. Deve retornar a wallet com sucesso.

### user.service.spec.ts 
Este arquivo contém testes para as funções das regras de negócio (services) do módulo 'user'.
Testes Incluídos:

   #### createUser()
      1.  Deve criar um novo usuário com sucesso.
      2.  Deve lançar ConflictException se o CPF for inválido.
      3.  Deve lançar ConflictException se o usuário já existir

   #### findUserByCpf()
      1.  Deve retornar um usuário com sucesso.
      2.  Deve lançar NotFoundException se o usuário não for encontrado.
    

   #### updateUser()
      1. Deve atualizar um usuário com sucesso

### user.controller.spec.ts 
Este arquivo contém testes para o controlador dos endpoints do módulo 'user'.
Testes Incluídos:

   #### createUser()
      1.  Deve criar um novo usuário com sucesso.
      2.  Deve lançar uma exceção em caso de erro.

   #### findByCpf()
      1. Deve retornar um usuário com sucesso.
      2. Deve lançar uma exceção em caso de erro.

   #### updateUser()
      1. Deve atualizar um usuário com sucesso.
      2. Deve lançar uma exceção em caso de erro (10 ms)
   
   #### deleteUser()
      1. Deve deletar um usuário com sucesso.
      2. Deve lançar uma exceção em caso de erro.

