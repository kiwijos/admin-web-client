<script lang="ts">
    import type { PageData } from './$types';
    export let data: PageData;
</script>

<div class="mx-auto gap-8 p-16 flex">
    {#each data.features as feature }
        <a href={feature.link} class="block card card-hover">
            <header class="card-header flex flex-col justify-end h-28 variant-soft-surface">
                <h1 class="text-lg">{feature.heading}</h1>
            </header>
            <section class="p-4 space-y-4">
                <h2 class="text-4xl font-bold">{feature.title}</h2>
                <div>
                    <p class="text-lg">{feature.description}</p>
                </div>
            </section>
            <footer class="card-footer"></footer>
        </a>
    {/each}
</div>
