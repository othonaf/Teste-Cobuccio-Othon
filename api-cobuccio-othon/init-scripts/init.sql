-- Active: 1732991700683@@127.0.0.1@3306@cobuccio
CREATE DATABASE IF NOT EXISTS cobuccio;

USE cobuccio;

-- Cria o banco de dados 'cobuccio' se não existir

-- Cria a tabela 'user' se não existir
CREATE TABLE IF NOT EXISTS user (
    cpf varchar(11) NOT NULL PRIMARY KEY,
    name varchar(150) NOT NULL,
    endereco varchar(255) NOT NULL,
    telefone VARCHAR(11) NOT NULL,
    email VARCHAR(40) NOT NULL
);

ALTER TABLE user ADD COLUMN senha VARCHAR(150) NOT NULL;

INSERT INTO
    user (
        cpf,
        name,
        endereco,
        telefone,
        email
    )
VALUES (
        '12345678901',
        'Maria Silva Santos',
        'Rua das Flores, 123, Jardim Primavera, São Paulo - SP',
        '11987654321',
        'maria.silva@email.com'
    );

SELECT * FROM user;

-- Cria a tabela 'wallet' se não existir
CREATE TABLE IF NOT EXISTS wallet (
    wallet_id CHAR(36) PRIMARY KEY DEFAULT(UUID()),
    user_cpf varchar(11) NOT NULL,
    balance float NOT NULL,
    date_created timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status varchar(20) NOT NULL DEFAULT 'active',
    currency varchar(3) NOT NULL DEFAULT 'BRL',
    account_type varchar(50) NOT NULL,
    FOREIGN KEY (user_cpf) REFERENCES user (cpf)
);

INSERT INTO
    wallet (
        user_cpf,
        balance,
        account_type
    )
VALUES (
        '12345678901',
        1000.50,
        'savings'
    );

SELECT * FROM wallet;