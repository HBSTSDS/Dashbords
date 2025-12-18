import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EventData } from "../types/EventData";

// Initialize API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateInsights(data: EventData[]) {
    if (!API_KEY) {
        throw new Error("API Key não configurada. Verifique o arquivo .env");
    }

    const cleanKey = API_KEY.trim();
    const genAI = new GoogleGenerativeAI(cleanKey);

    // Prepare a summary of data to avoid token limits with huge CSVs
    // We send the last 20 events + aggregate metrics
    const recentEvents = data.slice(0, 20).map(e =>
        `- ${e.data?.toLocaleDateString()} | ${e.evento} | Rec: R$${(e.receitaIngresse || 0) + (e.receitaPorta || 0) + (e.receitaBar || 0)} | Lucro: R$${((e.receitaIngresse || 0) + (e.receitaPorta || 0) + (e.receitaBar || 0)) - (e.custosTotais || 0)}`
    ).join('\n');

    const totalReceita = data.reduce((acc, curr) => acc + (curr.receitaIngresse || 0) + (curr.receitaPorta || 0) + (curr.receitaBar || 0), 0);
    const totalCustos = data.reduce((acc, curr) => acc + (curr.custosTotais || 0), 0);
    const lucro = totalReceita - totalCustos;

    // List of models to try in order of preference (Updated for 2025)
    // Based on diagnostic: gemini-2.5-flash appears to be the standard now
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash-exp", "gemini-1.5-flash"];

    let lastError;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Tentando modelo: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `
            Atue como um DIRETOR FINANCEIRO (CFO) experiente de uma produtora de eventos.
            Analise os dados abaixo friamente. NÃO repita números óbvios que já estão na tela.
            
            DADOS:
            - Receita Total: R$ ${totalReceita.toFixed(2)}
            - Margem de Lucro: ${(lucro / totalReceita * 100).toFixed(1)}%
            - Amostra de Eventos (Recentes):
            ${recentEvents}
            
            GERE UM RELATÓRIO DO TIPO "BULLET POINTS" COM 3 SEÇÕES OBRIGATÓRIAS (Use Markdown):
            
            1. 📊 **Diagnóstico Oculto**: Encontre uma correlação que não é óbvia (ex: relação entre custo e ticket médio, padrões de dia da semana ou tipos de eventos que dão prejuízo consistente).
            2. ⚠️ **Alerta Vermelho**: Identifique o maior gargalo financeiro atual (eventos específicos ou custos descontrolados). Seja direto e crítico.
            3. 🚀 **Plano de Ação Imediato**: Dê sugestões de negócio práticas para aumentar o ROI no próximo mês. Seja específico (ex: "Renegociar custo X", "Focar no evento Y").

            Formatação: Use **negrito** para destacar pontos chave. Não use introduções genéricas ("Olá equipe"). Vá direto ao ponto.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();

        } catch (error) {
            console.warn(`Falha com o modelo ${modelName}:`, error);
            lastError = error;
            // Continue to next model
        }
    }

    // If all generation attempts failed, try to list available models to help debugging
    try {
        console.log("Tentando listar modelos disponíveis...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
        const data = await response.json();
        const availableModels = data.models?.map((m: any) => m.name) || [];

        console.error("Modelos disponíveis para esta chave:", availableModels);

        const originalError = (lastError as any)?.message || lastError;
        throw new Error(`Nenhum modelo compatível encontrado. Modelos disponíveis na sua conta: ${availableModels.join(', ') || 'Nenhum'}. (Erro original: ${originalError})`);
    } catch (listError) {
        console.error("Erro ao listar modelos:", listError);
        const listErrMsg = (listError as any)?.message || String(listError);
        const origErrMsg = (lastError as any)?.message || String(lastError);

        // Show BOTH errors to the user
        throw new Error(`DIAGNÓSTICO FALHOU. \n\n1. Erro na IA: ${origErrMsg}\n\n2. Erro ao tentar listar modelos: ${listErrMsg}\n\n(Verifique se sua DATA/HORA está correta e a CHAVE .env não tem espaços)`);
    }
}
