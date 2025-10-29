'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Users, Calendar, Archive, DollarSign, PlusCircle, MoreHorizontal, FileText, ClipboardList, HandCoins, HelpCircle } from "lucide-react";

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
                                    <li><strong>Adicionar Novo Cliente:</strong> Use o botão <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Novo Cliente</Button> para cadastrar uma pessoa. Você pode incluir dados de contato, endereço e até a primeira compra com pagamento inicial.</li>
                                    <li><strong>Visão Geral Financeira:</strong> Os cartões no topo da página mostram o valor total que todos os clientes devem e a quantidade de clientes ativos no sistema.</li>
                                    <li><strong>Ações do Cliente:</strong> Na lista, ao lado de cada cliente, há um menu de ações <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button> onde você pode:
                                        <ul className="list-inside list-disc pl-5">
                                            <li><strong>Adicionar Venda:</strong> Registrar uma nova venda avulsa.</li>
                                            <li><strong>Dívida/Pagamento:</strong> Registrar uma nova compra (dívida) ou um pagamento avulso na conta do cliente.</li>
                                            <li><strong>Ver Histórico:</strong> Visualizar todas as compras, parcelas (pagas, pendentes e vencidas) e quitar parcelas.</li>
                                            <li><strong>Editar e Excluir:</strong> Atualizar as informações cadastrais ou remover o cliente do sistema.</li>
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
                                    <li><strong>Destaques Visuais:</strong> Os aniversariantes são destacados com cores diferentes para facilitar a identificação (aniversário hoje, na semana ou no mês).</li>
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
                                     <li><strong>Vendas Automáticas:</strong> Quando você registra uma compra para um cliente (nas telas de Clientes ou Dívidas), o estoque do produto vendido é atualizado automaticamente.</li>
                                    <li><strong>Histórico Detalhado:</strong> Clique em um produto para expandir e ver todo o seu histórico de movimentações. Você pode cancelar uma movimentação, e o sistema reverterá a operação (ex: devolvendo o produto ao estoque e estornando a compra do cliente).</li>
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
                                <p>Tenha uma visão clara da sua saúde financeira. Esta página agrupa seus recebimentos por mês, com base nos pagamentos efetivamente quitados.</p>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li><strong>Resumo Mensal:</strong> Cada cartão representa um mês e mostra o valor total que foi recebido naquele período.</li>
                                    <li><strong>Saldo Devedor Total:</strong> O cartão no topo da página mostra a soma de todas as parcelas de todos os clientes que ainda não foram pagas.</li>
                                    <li><strong>Detalhes do Mês:</strong> Clique em "Ver detalhes do mês" para expandir e ver a lista de todos os pagamentos que compõem o faturamento daquele período.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                            <AccordionTrigger>
                                 <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <span>Dívidas e Pagamentos</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <p>Uma tela focada para agilizar o registro de novas compras (dívidas) e pagamentos para a conta de seus clientes.</p>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li><strong>Ação Rápida:</strong> Use o botão principal <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Dívida/Pagamento</Button> para abrir um formulário onde você pode selecionar o cliente e escolher entre adicionar uma dívida (selecionando um produto do estoque) ou registrar um pagamento <HandCoins className="inline-block h-4 w-4" />.</li>
                                    <li><strong>Atalhos na Lista:</strong> A lista mostra todos os clientes com seus respectivos saldos devedores. Você pode usar o botão "Adicionar Dívida/Pgto." ao lado de cada cliente para abrir o mesmo formulário, já com aquele cliente pré-selecionado.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-6">
                            <AccordionTrigger>
                                 <div className="flex items-center gap-3">
                                    <ClipboardList className="h-5 w-5 text-primary" />
                                    <span>Pedidos Pendentes</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <p>Anote e controle facilmente os pedidos e encomendas que seus clientes fazem, garantindo que nada seja esquecido.</p>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li><strong>Registrar Pedido:</strong> Clique em <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Registrar Pedido</Button> para anotar o nome do cliente e o produto que ele encomendou.</li>
                                    <li><strong>Marcar como Concluído:</strong> Assim que o pedido for entregue, clique no botão "Marcar como Concluído" ao lado do pedido na lista. Ele será removido da lista de pendências.</li>
                                    <li><strong>Importante:</strong> Esta funcionalidade é um bloco de anotações e não está integrada ao controle de estoque ou financeiro. É uma ferramenta para lembretes.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
