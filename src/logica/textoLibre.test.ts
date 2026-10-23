import { describe, expect, it } from 'vitest'
import { analizarTexto, hayAlarmaEnTexto } from './textoLibre'

const etiquetas = (texto: string) => analizarTexto(texto).map((c) => c.palabra.etiqueta)

describe('texto libre', () => {
  it('detecta palabras clave sin importar tildes ni mayúsculas', () => {
    expect(etiquetas('Tengo DIARREA y he visto sangre')).toEqual(expect.arrayContaining(['diarrea', 'sangre']))
  })

  it('ignora palabras negadas', () => {
    expect(etiquetas('No he visto sangre esta semana')).toEqual([])
    expect(etiquetas('Estoy bien, sin dolor')).toEqual([])
  })

  it('una frase de alarma no cuenta además su palabra corta', () => {
    expect(etiquetas('Esta mañana he echado mucha sangre')).toEqual(['mucha sangre'])
    expect(hayAlarmaEnTexto('Esta mañana he echado mucha sangre')).toBe(true)
  })

  it('cuenta cada palabra clave una sola vez', () => {
    expect(etiquetas('dolor por la mañana y dolor por la noche')).toEqual(['dolor'])
  })

  it('un texto tranquilo no genera nada', () => {
    expect(etiquetas('Todo igual que siempre, gracias')).toEqual([])
    expect(hayAlarmaEnTexto('Todo igual que siempre, gracias')).toBe(false)
  })
})
