'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Users, Calendar, Archive, DollarSign, PlusCircle, MoreHorizontal, Gift, Package, CheckCircle, HelpCircle } from "lucide-react";

export function HelpPage() {
    return (
        <div className="space-y-8">
            <header className="flex items-center gap-4">
                 <HelpCircle className="h-10 w-10 text-primary" />
                 <div>
                    <h1 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">Central de Ajuda</h1>
                    <p className="text-muted-foreground">Encontre aqui tudo o que você precisa saber para usar o aplicativo.</p>
                </div>
            </header>

            <Card className="shadow-lg border-border">
                <CardHeader>
                    <CardTitle>Guia de Funcionalidades</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-primary" />
                                    <span>Gerenciamento de Clientes</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <p>A tela de clientes é o coração do sistema. Aqui você pode gerenciar todas as informações sobre as pessoas que compram de você.</p>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li><strong>Adicionar Novo Cliente:</strong> Use o botão <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Novo Cliente</Button> para cadastrar uma pessoa. Você pode incluir dados de contato, endereço e até a primeira compra.</li>
                                    <li><strong>Visão Geral Financeira:</strong> Os cartões no topo da página mostram o valor total que todos os clientes devem e a quantidade de clientes ativos no sistema.</li>
                                    <li><strong>Filtrar e Buscar:</strong> Use a barra de busca para encontrar um cliente rapidamente por nome, telefone, endereço, etc.</li>
                                    <li><strong>Ações do Cliente:</strong> Na lista, ao lado de cada cliente, há um menu de ações <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button> onde você pode:
                                        <ul className="list-inside list-disc pl-5">
                                            <li><strong>Adicionar Compra:</strong> Registrar uma nova venda para aquele cliente.</li>
                                            <li><strong>Ver Histórico:</strong> Visualizar todas as compras, parcelas (pagas, pendentes e vencidas) e quitar parcelas.</li>
                                            <li><strong>Editar Cliente:</strong> Atualizar as informações cadastrais.</li>
                                            <li><strong>Excluir Cliente:</strong> Remover o cliente e todo o seu histórico do sistema.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <span>Acompanhamento de Aniversários</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <p>Nunca mais perca a data especial de um cliente ou de seus familiares. Esta página organiza todos os aniversários para você.</p>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li><strong>Visualização Automática:</strong> A página lista todos os clientes e seus parentes cadastrados, ordenando pelos aniversários mais próximos.</li>
                                    <li><strong>Destaques Visuais:</strong> Os aniversariantes são destacados com cores diferentes para facilitar a identificação:
                                        <ul className="list-inside list-disc pl-5">
                                            <li><span className="font-semibold text-green-600">Verde:</span> O aniversário é hoje!</li>
                                            <li><span className="font-semibold text-red-600">Vermelho:</span> O aniversário é na próxima semana.</li>
                                            <li><span className="font-semibold text-yellow-600">Amarelo:</span> O aniversário é neste mês.</li>
                                        </ul>
                                    </li>
                                    <li><strong>Adicionar Parentes:</strong> Use o botão <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Parente</Button> para cadastrar familiares (filhos, cônjuge, etc.) de um cliente, vinculando-os ao cadastro principal.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>
                                 <div className="flex items-center gap-3">
                                    <Archive className="h-5 w-5 text-primary" />
                                    <span>Controle de Estoque</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                               <p>Mantenha seu inventário sempre organizado. Saiba exatamente quantos produtos você tem e acompanhe todas as entradas e saídas.</p>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li><strong>Movimentar Produto:</strong> Clique em <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Movimentar Produto</Button> para registrar uma compra (entrada de mercadoria) ou uma venda manual (saída).</li>
                                     <li><strong>Vendas Automáticas:</strong> Quando você registra uma compra para um cliente (na tela de Clientes), o estoque do produto vendido é atualizado automaticamente.</li>
                                    <li><strong>Histórico Detalhado:</strong> Clique em um produto para expandir e ver todo o seu histórico de movimentações, incluindo datas, tipo (compra/venda) e cliente associado.</li>
                                    <li><strong>Edição e Exclusão:</strong> Use o menu de ações <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button> em cada produto para editar seu nome ou excluí-lo.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-4">
                            <AccordionTrigger>
                                 <div className="flex items-center gap-3">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    <span>Visão de Faturamento</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <p>Tenha uma visão clara da sua saúde financeira. Esta página agrupa seus recebimentos por mês.</p>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li><strong>Resumo Mensal:</strong> Cada cartão representa um mês e mostra o valor total que foi efetivamente quitado naquele período.</li>
                                    <li><strong>Saldo Devedor Total:</strong> O cartão no topo da página mostra a soma de todas as parcelas que ainda não foram pagas (vencidas e a vencer).</li>
                                    <li><strong>Detalhes do Mês:</strong> Clique em "Ver detalhes do mês" para expandir e ver uma lista de todas as transações daquele período, mostrando o cliente, o status (quitado, vencido, pendente) e o valor de cada uma.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
